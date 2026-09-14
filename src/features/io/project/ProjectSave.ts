import { finalizePendingInput, isBusy, runExclusive, setBusyProgress, type BusyHandle, type BusyMode } from '~/features/busy';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { logSystemError, logSystemWarn, logUserError, logUserInfo, logUserSuccess, logUserWarn } from '~/features/log/service';
import { markProjectSaved } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { makeSnapshotsAllRuntime } from '~/features/snapshot';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { getProjectFromRuntime } from '~/stores/RuntimeProject';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { eventBus, SaveProgressPhase } from '~/utils/EventBus';
import { getFileNameWithoutExtension, getFileUniqueId, normalizeJoin, pathToFileLocation, projectSaveDir } from '~/utils/FileUtils';
import { calcThumbnailSize } from '~/utils/ThumbnailUtils';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { packr } from '~/utils/msgpackr';
import { core, dialog, fs, path } from '~/utils/platform';

async function folderSelection(nameWOExtension: string) {
  const defaultPath = normalizeJoin(await projectSaveDir(), `${nameWOExtension}.sledge`);
  return await dialog.save({
    title: 'save sledge project',
    defaultPath,
    canCreateDirectories: true,
    filters: [{ name: 'sledge project', extensions: ['sledge'] }],
  });
}

async function saveThumbnailData(selectedPath: string) {
  const fileId = await getFileUniqueId(selectedPath);
  const { width, height } = projectStore.canvas.size;
  const thumbSize = calcThumbnailSize(width, height);
  const thumbnailBlob = await canvasThumbnailGenerator.generateCanvasThumbnailBlob(thumbSize.width, thumbSize.height);
  const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
  return await saveThumbnailExternal(fileId, thumbnailDataUrl);
}

const LOG_LABEL = 'ProjectSave';

type SaveProgressReporter = (phase: SaveProgressPhase, done: number, total: number) => void;

/**
 * @description report a save's progress to everyone watching: the event stream, and the same line to the
 *   bottom bar, the devtools console and stdout. phases that take one step report twice (start, finish),
 *   which reads as the same line, so identical consecutive lines are not logged again.
 */
function createProgressReporter(): SaveProgressReporter {
  let lastLine: string | undefined;
  return (phase, done, total) => {
    const line = `saving project... [${total > 1 ? `${phase} ${done}/${total}` : phase}]`;
    if (line !== lastLine) {
      lastLine = line;
      logUserInfo(line, { label: LOG_LABEL, persistent: true });
    }
    // the modal reads the busy state rather than this event stream, so it has to be told here too.
    setBusyProgress({ phase, done, total });
    // the line is up before the event, so anything the event wakes reads the same tick, not the last one
    eventBus.emit('project:saveProgress', { phase, done, total });
  };
}

/**
 * @description get MessagePack-compressed current project (including buffers)
 */
export async function getPackedCurrentProject(options?: { signal?: AbortSignal; onProgress?: SaveProgressReporter }): Promise<Uint8Array> {
  const { signal, onProgress } = options ?? {};

  const project = await getProjectFromRuntime({ signal, onProgress });

  signal?.throwIfAborted();
  // packing is one indivisible call, so it can only be reported as started and finished
  onProgress?.('pack', 0, 1);
  const packed = packr.pack(project);
  onProgress?.('pack', 1, 1);
  return packed;
}

/**
 * @description write through a temporary file and swap it in, so an interrupted write cannot destroy the existing project.
 */
async function writeProjectFile(path: string, data: Uint8Array): Promise<void> {
  const tempPath = `${path}.saving`;
  await fs.writeFile(tempPath, data);
  try {
    await fs.rename(tempPath, path);
  } catch (error) {
    try {
      await fs.remove(tempPath);
    } catch (_e) {
      // leaving the temp file behind is not worth masking the rename error
    }
    throw error;
  }
}

type SaveTarget = { name?: string; existingPath?: string };

/**
 * @description how a save ended. `cancelled` covers both the user stopping a running save and declining the
 *   dialog that asks where to write - in neither case did anything go wrong, so a caller reporting a failure
 *   must not report those.
 */
export type SaveResult = 'saved' | 'failed' | 'cancelled';

let saveInFlight: Promise<SaveResult> | undefined;
let saveInFlightTarget: SaveTarget | undefined;
let saveAbort: AbortController | undefined;
/** @description set once the running save reaches its write; from then on it cannot be cancelled. */
let writeStarted = false;

export interface SaveProjectOptions {
  /**
   * @description how this save relates to the window's exclusive period. `inherit` is for a save that is
   *   one step of a larger operation that already holds it - quitting, which runs from the unsaved-changes
   *   prompt through to the save that answers it as a single stretch.
   */
  busy?: BusyMode;
}

/**
 * @description save the current project.
 *   saving a large project takes seconds, so a repeat of the running save (Ctrl+S held down, the button and
 *   the shortcut together) shares it instead of writing the same file twice. a call aimed somewhere else is
 *   a different request: handing it the running save's result would report a file it never wrote, so it is
 *   turned down and the user is told.
 *
 *   the save then takes the window for the whole of its run - from picking a destination to the last store
 *   it updates afterwards - so nothing can edit the project it is describing, and no other long operation
 *   can start alongside it.
 */
export async function saveProject(name?: string, existingPath?: string, options?: SaveProjectOptions): Promise<SaveResult> {
  // the in-flight check comes before taking the window, because a repeat of the running save is answered
  // by that save rather than turned down - and the window it would be asking for is the one it already has.
  if (saveInFlight) {
    if (saveInFlightTarget?.name === name && saveInFlightTarget?.existingPath === existingPath) {
      logSystemWarn('Save already in progress. Reusing the in-flight save.', { label: LOG_LABEL });
      return saveInFlight;
    }
    logUserWarn('another save is still running.', { label: LOG_LABEL, persistent: true });
    return 'failed';
  }

  // no save is running, so a window that is already taken is held by some other operation. turn the save
  // down here rather than inside the exclusive run, so a refused call never becomes the in-flight save.
  // nothing awaits between this check and the acquisition below, so the answer cannot go stale.
  const busyMode = options?.busy ?? 'acquire';
  if (busyMode === 'acquire' && isBusy()) {
    logUserWarn('another operation is still running.', { label: LOG_LABEL, persistent: true });
    return 'failed';
  }

  const controller = new AbortController();
  saveAbort = controller;
  saveInFlightTarget = { name, existingPath };
  writeStarted = false;
  saveInFlight = runExclusive(
    'save',
    async (handle) => {
      // before anything is read: whatever the user is still in the middle of has to be committed, so the
      // bytes about to be assembled match what is on screen and what undo can walk back through. this runs
      // before the first await below, so no input can arrive between the two.
      finalizePendingInput();
      return await saveProjectInternal(name, existingPath, controller.signal, handle);
    },
    {
      mode: busyMode,
      // the destination comes first, and the dialog asking for it is already modal to this window. the
      // modal goes up once there is a destination - see `presentDialog` calls in saveProjectInternal.
      deferDialog: true,
      onRejected: (): SaveResult => 'failed',
    }
  )
    .then((result) => result ?? 'failed')
    .finally(() => {
      saveInFlight = undefined;
      saveInFlightTarget = undefined;
      writeStarted = false;
      if (saveAbort === controller) saveAbort = undefined;
    });
  return saveInFlight;
}

/** @description whether a save is running and could still be cancelled. */
export function isSaveInProgress(): boolean {
  return saveInFlight !== undefined;
}

/**
 * @description whether the running save has passed the point where stopping it is still meaningful.
 *
 *   the write cannot be interrupted - the bytes go out over IPC in one call - so once it has started the
 *   file is going to be written whatever happens here. accepting a cancel then would only throw away the
 *   bookkeeping that records the write, leaving a file on disk the editor does not know it wrote.
 */
export function isSaveCancellable(): boolean {
  return saveInFlight !== undefined && !writeStarted;
}

/**
 * @description stop the running save, if it can still be stopped. it gives up between buffers, so nothing
 *   partly written reaches the project file - the write only starts once every buffer is in hand.
 *
 *   returns whether the request was taken. a save already writing turns it down: see `isSaveCancellable`.
 */
export function cancelSave(): boolean {
  if (!isSaveCancellable()) return false;
  saveAbort?.abort();
  return true;
}

/** @description a save the user stopped is not a failure; report it as the cancellation it is. */
function handleSaveAborted(error: unknown, signal: AbortSignal | undefined, label: string): boolean {
  if (!signal?.aborted) return false;
  logUserWarn('project save cancelled.', { label, details: [error] });
  eventBus.emit('project:saveCancelled', {});
  return true;
}

/**
 * @description where this save writes, or null when the user declined. an overwrite of an outdated project
 *   asks first, and declining that is the same answer as declining the file dialog.
 */
async function selectSavePath(name?: string, existingPath?: string): Promise<string | null> {
  if (ioStore.openAs === 'project' && existingPath && name) {
    // alert if overwriting when current project version is not equal to loaded project version
    const loadedProjectVersion = ioStore.loadProjectVersion?.project ?? 0;
    const isOW = ioStore.savedLocation.path === existingPath && ioStore.savedLocation.name === name;
    if (isOW && loadedProjectVersion !== CURRENT_PROJECT_VERSION) {
      const confirmResult = await dialog.confirm(
        `Trying to overwrite project that has outdated version.

old: V${loadedProjectVersion}
new: V${CURRENT_PROJECT_VERSION}

After overwrite, you cannot open this project in old version of sledge.`,
        {
          okLabel: 'Save Anyway',
          cancelLabel: 'Cancel',
          kind: 'warning',
          title: 'Overwrite outdated project',
        }
      );

      if (!confirmResult) return null;
    }
    // overwrite existing project
    return normalizeJoin(existingPath, name);
  }

  // write as new project, under the current name when there is one ($HOME/sledge/new project.sledge if not)
  return await folderSelection(name ? getFileNameWithoutExtension(name) : 'new project');
}

async function saveProjectInternal(name?: string, existingPath?: string, signal?: AbortSignal, handle?: BusyHandle): Promise<SaveResult> {
  const report = createProgressReporter();
  if (!core.isTauri()) {
    // a browser save has no destination to ask for - the download is named and taken at the end - so there
    // is nothing to wait behind and the modal goes up straight away.
    handle?.presentDialog();
    try {
      const fileNameWOExtension = getFileNameWithoutExtension(name ?? ioStore.savedLocation.name ?? 'new project');
      const fileName = `${fileNameWOExtension}.sledge`;
      // read before assembling: whatever the user draws while we build these bytes is not in them.
      const savedRevision = ioStore.projectRevision;
      // read up front so the abort check below is the last thing in this path that can yield: everything it
      // guards has to run in one tick, or a project loaded while we awaited would be handed this save's state.
      const sledgeVersion = await getCurrentVersion();
      const bytes = await getPackedCurrentProject({ signal, onProgress: report });
      // the download is handed to the browser below and cannot be taken back, so a cancel is refused from
      // here on for the same reason as the tauri path.
      writeStarted = true;
      report('write', 0, 1);
      const blob = new Blob([bytes.slice()], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      // same as the tauri path: the download is out, but the runtime this save describes may already be gone.
      signal?.throwIfAborted();

      setIOStore('loadProjectVersion', {
        sledge: sledgeVersion,
        project: CURRENT_PROJECT_VERSION,
      });
      setIOStore('openAs', 'project');
      setIOStore('savedLocation', {
        path: undefined,
        name: fileName,
      });
      setProjectStore('project', 'lastSavedAt', new Date());
      makeSnapshotsAllRuntime();

      report('write', 1, 1);
      markProjectSaved(savedRevision);
      logUserSuccess('project saved.', { label: LOG_LABEL, persistent: true });
      return 'saved';
    } catch (error) {
      if (handleSaveAborted(error, signal, LOG_LABEL)) return 'cancelled';
      logSystemError('Error saving project.', { label: LOG_LABEL, details: [error] });
      logUserError('project save failed.', { label: LOG_LABEL, details: [error], persistent: true });
      eventBus.emit('project:saveFailed', { error: error });
      return 'failed';
    }
  }

  let selectedPath: string | null;
  try {
    selectedPath = await selectSavePath(name, existingPath);
  } catch (error) {
    // a dialog that fails is not the user declining: report it the way the rest of the save reports a
    // failure, rather than letting it out of a call the whole app treats as answering with a SaveResult.
    logSystemError('Error selecting save destination.', { label: LOG_LABEL, details: [error] });
    logUserError('project save failed.', { label: LOG_LABEL, details: [error], persistent: true });
    eventBus.emit('project:saveFailed', { error });
    return 'failed';
  }

  if (typeof selectedPath === 'string') {
    // there is a destination, so from here the save is work rather than a question. the modal goes up now:
    // a save the user declined never raises one at all.
    handle?.presentDialog();
    try {
      // const thumbpath = await saveThumbnailData(selectedPath);

      // read before assembling: whatever the user draws while we build these bytes is not in them.
      const savedRevision = ioStore.projectRevision;
      // read up front so the abort check below is the last thing in this path that can yield: everything it
      // guards has to run in one tick, or a project loaded while we awaited would be handed this save's state.
      const sledgeVersion = await getCurrentVersion();
      const data = await getPackedCurrentProject({ signal, onProgress: report });
      // past this point the file is committed: the bytes are complete, and the write goes through a temp file,
      // so a cancel arriving now cannot leave a partial project behind. it is also refused from here on -
      // the write cannot be interrupted, so taking one would only lose the record of what was written.
      writeStarted = true;
      report('write', 0, 1);
      await writeProjectFile(selectedPath, data);
      // the bytes are on disk and complete, but a project loaded while we were writing has already replaced
      // the runtime this save describes - applying the state below to it would point the new project at this
      // file and drop its snapshots.
      signal?.throwIfAborted();
      report('write', 1, 1);
      addRecentFile(pathToFileLocation(selectedPath));

      // the file on disk is V2 only once the write succeeded, so update the loaded version here and not earlier.
      setIOStore('loadProjectVersion', {
        sledge: sledgeVersion,
        project: CURRENT_PROJECT_VERSION,
      });
      setIOStore('openAs', 'project');
      setSavedLocation(selectedPath);
      // @ts-ignore
      window.__PATH__ = selectedPath;
      setProjectStore('project', 'lastSavedAt', new Date());
      makeSnapshotsAllRuntime();
      const loc = pathToFileLocation(selectedPath);
      if (loc) eventBus.emit('project:saved', { location: loc });

      markProjectSaved(savedRevision);
      logUserSuccess('project saved.', { label: LOG_LABEL, persistent: true });
      return 'saved';
    } catch (error) {
      if (handleSaveAborted(error, signal, LOG_LABEL)) return 'cancelled';
      logSystemError('Error saving project.', { label: LOG_LABEL, details: [error, selectedPath] });
      logUserError('project save failed.', { label: LOG_LABEL, details: [error], persistent: true });
      eventBus.emit('project:saveFailed', { error: error });
      return 'failed';
    }
  }

  eventBus.emit('project:saveCancelled', {});
  logUserWarn('project save cancelled.', { label: LOG_LABEL });
  return 'cancelled';
}

export const thumbnailDir = async () => normalizeJoin(await path.appDataDir(), 'thumbnails');
export const thumbnailPath = async (fileId: string) => normalizeJoin(await path.appDataDir(), 'thumbnails', fileId);

export async function saveThumbnailExternal(fileId: string, dataUrl: string): Promise<string> {
  const dir = await thumbnailDir();
  if (!(await fs.exists(dir))) {
    await fs.mkdir(dir, { recursive: true });
  }
  const path = normalizeJoin(dir, `${fileId}.png`);
  const bytes = dataUrlToBytes(dataUrl);
  await fs.writeFile(path, bytes);
  return path;
}
