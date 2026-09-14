import { finalizePendingInput, isBusy, runExclusive, setBusyProgress, type BusyHandle, type BusyMode } from '~/features/busy';
import { setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { logSystemError, logSystemWarn, logUserError, logUserInfo, logUserSuccess, logUserWarn } from '~/features/log/service';
import { markProjectSaved } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { makeSnapshotsAllRuntime } from '~/features/snapshot';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { getProjectFromRuntime } from '~/stores/RuntimeProject';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { eventBus, SaveProgressPhase } from '~/utils/EventBus';
import { getFileNameWithoutExtension, normalizeJoin, pathToFileLocation, projectSaveDir } from '~/utils/FileUtils';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { packr } from '~/utils/msgpackr';
import { core, dialog, fs } from '~/utils/platform';

async function folderSelection(nameWOExtension: string) {
  const defaultPath = normalizeJoin(await projectSaveDir(), `${nameWOExtension}.sledge`);
  return await dialog.save({
    title: 'save sledge project',
    defaultPath,
    canCreateDirectories: true,
    filters: [{ name: 'sledge project', extensions: ['sledge'] }],
  });
}

const LOG_LABEL = 'ProjectSave';

type SaveProgressReporter = (phase: SaveProgressPhase, done: number, total: number) => void;

/**
 * @description report a save's progress to the event stream, the busy state and the bottom bar. a one-step
 *   phase reports start and finish as the same line, so consecutive identical lines are skipped.
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

/** @description hand the bytes to the browser as a download. the counterpart of `writeProjectFile`. */
function downloadProjectFile(fileName: string, data: Uint8Array): void {
  const blob = new Blob([data.slice()], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type SaveTarget = { name?: string; existingPath?: string };

/**
 * @description how a save ended. `cancelled` covers both stopping a running save and declining the
 *   destination dialog: neither is a failure, so a caller must not report them as one.
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
   *   one step of a larger operation already holding it - quitting, which prompts and then saves.
   */
  busy?: BusyMode;
}

/**
 * @description save the current project. a repeat of the running save shares it instead of writing the same
 *   file twice; a call aimed at a different destination is turned down, since the running save's result
 *   would name a file it never wrote. holds the window from picking a destination to the last store update.
 */
export async function saveProject(name?: string, existingPath?: string, options?: SaveProjectOptions): Promise<SaveResult> {
  // checked before taking the window: a repeat of the running save is answered by that save, and the
  // window it would be asking for is the one that save already holds.
  if (saveInFlight) {
    if (saveInFlightTarget?.name === name && saveInFlightTarget?.existingPath === existingPath) {
      logSystemWarn('Save already in progress. Reusing the in-flight save.', { label: LOG_LABEL });
      return saveInFlight;
    }
    logUserWarn('another save is still running.', { label: LOG_LABEL, persistent: true });
    return 'failed';
  }

  // no save is running, so a taken window is held by something else. refused here rather than inside the
  // exclusive run, so a refused call never becomes the in-flight save. nothing awaits before acquisition.
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
      // open gestures and pending history entries are committed first, so the assembled bytes match the
      // canvas and the undo stack. runs before the first await below, so no input can arrive in between.
      finalizePendingInput();
      return await saveProjectExclusive(name, existingPath, controller.signal, handle);
    },
    {
      mode: busyMode,
      // the destination comes first, and the dialog asking for it is already modal to this window. the
      // modal goes up once there is a destination - see `presentDialog` calls in saveProjectExclusive.
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
 * @description whether the running save can still be stopped. the write cannot be interrupted - the bytes go
 *   out over IPC in one call - so a cancel accepted after it starts would only drop the bookkeeping that
 *   records the write, leaving a file on disk the editor does not know it wrote.
 */
export function isSaveCancellable(): boolean {
  return saveInFlight !== undefined && !writeStarted;
}

/**
 * @description stop the running save, if it can still be stopped. it gives up between buffers, and the write
 *   only starts once every buffer is in hand, so nothing partly written reaches the project file.
 *   returns whether the request was taken; a save already writing turns it down - see `isSaveCancellable`.
 */
export function cancelSave(): boolean {
  if (!isSaveCancellable()) return false;
  saveAbort?.abort();
  return true;
}

/** @description a stopped save is not a failure; report it as the cancellation it is. */
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

/**
 * @description record a save that landed. the version is only current once the write succeeded, so this runs
 *   after it and not earlier.
 */
function applySaveToStores(sledgeVersion: string, savedRevision: number): void {
  setIOStore('loadProjectVersion', {
    sledge: sledgeVersion,
    project: CURRENT_PROJECT_VERSION,
  });
  setIOStore('openAs', 'project');
  setProjectStore('project', 'lastSavedAt', new Date());
  makeSnapshotsAllRuntime();
  markProjectSaved(savedRevision);
}

/** @description report a save that threw. a cancellation is answered by the caller before this. */
function reportSaveFailure(error: unknown, options?: { systemMessage?: string; details?: unknown[] }): SaveResult {
  logSystemError(options?.systemMessage ?? 'Error saving project.', { label: LOG_LABEL, details: [error, ...(options?.details ?? [])] });
  logUserError('project save failed.', { label: LOG_LABEL, details: [error], persistent: true });
  eventBus.emit('project:saveFailed', { error });
  return 'failed';
}

/** @description a declined destination. the same answer whichever dialog asked. */
function reportSaveDeclined(): SaveResult {
  eventBus.emit('project:saveCancelled', {});
  logUserWarn('project save cancelled.', { label: LOG_LABEL });
  return 'cancelled';
}

/**
 * @description the body of a save, run while the window is held. `saveProject` is the only caller: calling
 *   this directly would read the project without the exclusion and in-flight bookkeeping it depends on.
 */
async function saveProjectExclusive(name?: string, existingPath?: string, signal?: AbortSignal, handle?: BusyHandle): Promise<SaveResult> {
  const report = createProgressReporter();

  if (!core.isTauri()) {
    // a browser save has no destination to ask for - the download is named and taken at the end - so there
    // is nothing to wait behind and the modal goes up straight away.
    handle?.presentDialog();
    try {
      const fileNameWOExtension = getFileNameWithoutExtension(name ?? ioStore.savedLocation.name ?? 'new project');
      const fileName = `${fileNameWOExtension}.sledge`;
      // read before assembly; later edits are not in these bytes.
      const savedRevision = ioStore.projectRevision;
      // read up front so the abort check below is the last yield in this path: what it guards has to run in
      // one tick, or a project loaded in between would be handed this save's state.
      const sledgeVersion = await getCurrentVersion();
      const bytes = await getPackedCurrentProject({ signal, onProgress: report });
      // the download is handed to the browser below and cannot be taken back, so a cancel is refused from
      // here on for the same reason as the tauri path.
      writeStarted = true;
      report('write', 0, 1);
      downloadProjectFile(fileName, bytes);
      // same as the tauri path: the download is out, but the runtime this save describes may already be gone.
      signal?.throwIfAborted();
      report('write', 1, 1);

      setIOStore('savedLocation', {
        path: undefined,
        name: fileName,
      });
      applySaveToStores(sledgeVersion, savedRevision);
      logUserSuccess('project saved.', { label: LOG_LABEL, persistent: true });
      return 'saved';
    } catch (error) {
      if (handleSaveAborted(error, signal, LOG_LABEL)) return 'cancelled';
      return reportSaveFailure(error);
    }
  }

  let selectedPath: string | null;
  try {
    selectedPath = await selectSavePath(name, existingPath);
  } catch (error) {
    // a dialog that fails is not a declined one: reported as a failure rather than thrown out of a call
    // whose callers expect a SaveResult.
    return reportSaveFailure(error, { systemMessage: 'Error selecting save destination.' });
  }
  if (typeof selectedPath !== 'string') return reportSaveDeclined();

  // there is a destination, so from here the save is work rather than a question. a declined save never
  // raises the modal at all.
  handle?.presentDialog();
  try {
    // const thumbpath = await saveThumbnailData(selectedPath); // see ProjectThumbnail.ts

    // read before assembly; later edits are not in these bytes.
    const savedRevision = ioStore.projectRevision;
    // read up front so the abort check below is the last yield in this path: what it guards has to run in
    // one tick, or a project loaded in between would be handed this save's state.
    const sledgeVersion = await getCurrentVersion();
    const data = await getPackedCurrentProject({ signal, onProgress: report });
    // the bytes are complete and the write goes through a temp file, so a cancel arriving now cannot leave
    // a partial project behind. it is refused from here on - see `isSaveCancellable`.
    writeStarted = true;
    report('write', 0, 1);
    await writeProjectFile(selectedPath, data);
    // the bytes are on disk, but a project loaded during the write has already replaced the runtime this
    // save describes - applying the state below would point that project at this file and drop its snapshots.
    signal?.throwIfAborted();
    report('write', 1, 1);

    addRecentFile(pathToFileLocation(selectedPath));
    setSavedLocation(selectedPath);
    // @ts-ignore
    window.__PATH__ = selectedPath;
    applySaveToStores(sledgeVersion, savedRevision);
    const loc = pathToFileLocation(selectedPath);
    if (loc) eventBus.emit('project:saved', { location: loc });

    logUserSuccess('project saved.', { label: LOG_LABEL, persistent: true });
    return 'saved';
  } catch (error) {
    if (handleSaveAborted(error, signal, LOG_LABEL)) return 'cancelled';
    return reportSaveFailure(error, { details: [selectedPath] });
  }
}
