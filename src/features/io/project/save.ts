import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { logSystemError, logUserError, logUserSuccess, logUserWarn } from '~/features/log/service';
import { makeSnapshotsAllRuntime } from '~/features/snapshot';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { getProjectFromRuntime } from '~/stores/RuntimeProject';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
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

/**
 * @description get MessagePack-compressed current project (including buffers)
 */
export async function getPackedCurrentProject(): Promise<Uint8Array> {
  const project = await getProjectFromRuntime();
  const packed = packr.pack(project);
  return packed;
}

export async function saveProject(name?: string, existingPath?: string): Promise<boolean> {
  const LOG_LABEL = 'ProjectSave';
  if (!core.isTauri()) {
    try {
      setIOStore('loadProjectVersion', {
        sledge: await getCurrentVersion(),
        project: CURRENT_PROJECT_VERSION,
      });

      const fileNameWOExtension = getFileNameWithoutExtension(name ?? ioStore.savedLocation.name ?? 'new project');
      const fileName = `${fileNameWOExtension}.sledge`;
      const bytes = await getPackedCurrentProject();
      const blob = new Blob([bytes.slice()], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIOStore('openAs', 'project');
      setIOStore('savedLocation', {
        path: undefined,
        name: fileName,
      });
      setProjectStore('project', 'lastSavedAt', new Date());
      makeSnapshotsAllRuntime();

      setIOStore('isProjectChangedAfterSave', false);
      logUserSuccess('project saved.', { label: LOG_LABEL, persistent: true });
      return true;
    } catch (error) {
      logSystemError('Error saving project.', { label: LOG_LABEL, details: [error] });
      logUserError('project save failed.', { label: LOG_LABEL, details: [error], persistent: true });
      eventBus.emit('project:saveFailed', { error: error });
      return false;
    }
  }

  let selectedPath: string | null;

  let fileNameWOExtension = name ? getFileNameWithoutExtension(name) : 'new project';

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

      if (!confirmResult) return false;
    }
    // overwrite existing project
    selectedPath = normalizeJoin(existingPath, name);
  } else if (name) {
    // write as new project in existing name
    selectedPath = await folderSelection(fileNameWOExtension);
  } else {
    // write as new project ($HOME&/sledge/new project.sledge)
    selectedPath = await folderSelection('new project');
  }

  if (typeof selectedPath === 'string') {
    try {
      // overwrite project versions
      setIOStore('loadProjectVersion', {
        sledge: await getCurrentVersion(),
        project: CURRENT_PROJECT_VERSION,
      });

      // const thumbpath = await saveThumbnailData(selectedPath);

      let data = await getPackedCurrentProject();
      await fs.writeFile(selectedPath, data);
      // @ts-ignore
      data = null;
      addRecentFile(pathToFileLocation(selectedPath));

      setIOStore('openAs', 'project');
      setSavedLocation(selectedPath);
      // @ts-ignore
      window.__PATH__ = selectedPath;
      setProjectStore('project', 'lastSavedAt', new Date());
      makeSnapshotsAllRuntime();
      const loc = pathToFileLocation(selectedPath);
      if (loc) eventBus.emit('project:saved', { location: loc });

      setIOStore('isProjectChangedAfterSave', false);
      logUserSuccess('project saved.', { label: LOG_LABEL, persistent: true });
      return true;
    } catch (error) {
      logSystemError('Error saving project.', { label: LOG_LABEL, details: [error, selectedPath] });
      logUserError('project save failed.', { label: LOG_LABEL, details: [error], persistent: true });
      eventBus.emit('project:saveFailed', { error: error });
      return false;
    }
  }

  eventBus.emit('project:saveCancelled', {});
  logUserWarn('project save cancelled.', { label: LOG_LABEL });
  return false;
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
