import { appDataDir } from '@tauri-apps/api/path';
import { confirm, save } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { dumpProject } from '~/features/io/project/out/dump';
import { CURRENT_PROJECT_VERSION } from '~/features/io/types/Project';
import { logSystemError, logUserError, logUserSuccess, logUserWarn } from '~/features/log/service';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { canvasStore, projectStore, setProjectStore } from '~/stores/ProjectStores';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
import { getFileNameWithoutExtension, getFileUniqueId, normalizeJoin, pathToFileLocation, projectSaveDir } from '~/utils/FileUtils';
import { calcThumbnailSize } from '~/utils/ThumbnailUtils';

async function folderSelection(nameWOExtension: string) {
  const defaultPath = normalizeJoin(await projectSaveDir(), `${nameWOExtension}.sledge`);
  return await save({
    title: 'save sledge project',
    defaultPath,
    canCreateDirectories: true,
    filters: [{ name: 'sledge project', extensions: ['sledge'] }],
  });
}

async function saveThumbnailData(selectedPath: string) {
  const fileId = await getFileUniqueId(selectedPath);
  const { width, height } = canvasStore.canvas;
  const thumbSize = calcThumbnailSize(width, height);
  const thumbnailBlob = await canvasThumbnailGenerator.generateCanvasThumbnailBlob(thumbSize.width, thumbSize.height);
  const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
  return await saveThumbnailExternal(fileId, thumbnailDataUrl);
}

export async function saveProject(name?: string, existingPath?: string): Promise<boolean> {
  const LOG_LABEL = 'ProjectSave';
  let selectedPath: string | null;

  let fileNameWOExtension = name ? getFileNameWithoutExtension(name) : 'new project';

  if (fileStore.openAs === 'project' && existingPath && name) {
    // alert if overwriting when current project version is not equal to loaded project version
    const loadedProjectVersion = projectStore.loadProjectVersion?.project ?? 0;
    const isOW = fileStore.savedLocation.path === existingPath && fileStore.savedLocation.name === name;
    if (isOW && loadedProjectVersion !== CURRENT_PROJECT_VERSION) {
      const confirmResult = await confirm(
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
      const thumbpath = await saveThumbnailData(selectedPath);

      const data = await dumpProject();
      await writeFile(selectedPath, data);
      addRecentFile(pathToFileLocation(selectedPath));

      setFileStore('openAs', 'project');
      setSavedLocation(selectedPath);
      // @ts-ignore
      window.__PATH__ = selectedPath;
      setProjectStore('lastSavedAt', new Date());
      const loc = pathToFileLocation(selectedPath);
      if (loc) eventBus.emit('project:saved', { location: loc });

      setProjectStore('isProjectChangedAfterSave', false);
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

export const thumbnailDir = async () => normalizeJoin(await appDataDir(), 'thumbnails');
export const thumbnailPath = async (fileId: string) => normalizeJoin(await appDataDir(), 'thumbnails', fileId);

export async function saveThumbnailExternal(fileId: string, dataUrl: string): Promise<string> {
  const dir = await thumbnailDir();
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  const path = normalizeJoin(dir, `${fileId}.png`);
  const bytes = dataUrlToBytes(dataUrl);
  await writeFile(path, bytes);
  return path;
}
