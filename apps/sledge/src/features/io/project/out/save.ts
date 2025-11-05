import { FileLocation } from '@sledge/core';
import { appDataDir } from '@tauri-apps/api/path';
import { confirm, save } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { calcThumbnailSize, ThumbnailGenerator } from '~/features/canvas/ThumbnailGenerator';
import { setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { dumpProject } from '~/features/io/project/out/dump';
import { CURRENT_PROJECT_VERSION } from '~/features/io/types/Project';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { canvasStore, projectStore, setProjectStore } from '~/stores/ProjectStores';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
import { getDefaultProjectDir, getFileNameWithoutExtension, getFileUniqueId, normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';

async function folderSelection(location?: FileLocation) {
  const nameWOExtension = location?.name ? getFileNameWithoutExtension(location?.name) : 'new project';
  const defaultPath = normalizeJoin(location?.path ?? (await getDefaultProjectDir()), `${nameWOExtension}.sledge`);
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
  const thumbnailBlob = await new ThumbnailGenerator().generateCanvasThumbnailBlob(thumbSize.width, thumbSize.height);
  const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
  return await saveThumbnailExternal(fileId, thumbnailDataUrl);
}

export async function saveProject(name?: string, existingPath?: string): Promise<boolean> {
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
  } else if (fileStore.openAs === 'image' && name) {
    // write as new project from image path and name
    selectedPath = await folderSelection({ path: existingPath, name: `${fileNameWOExtension}.sledge` });
  } else {
    // write as new project ($HOME&/sledge/new project.sledge)
    selectedPath = await folderSelection();
  }

  if (typeof selectedPath === 'string') {
    try {
      const thumbpath = await saveThumbnailData(selectedPath);

      const data = await dumpProject();
      await writeFile(selectedPath, data);
      console.log('project saved to:', selectedPath);
      addRecentFile(pathToFileLocation(selectedPath));

      setFileStore('openAs', 'project');
      setSavedLocation(selectedPath);
      // @ts-ignore
      window.__PATH__ = selectedPath;

      setProjectStore('lastSavedPath', selectedPath);
      setProjectStore('lastSavedAt', new Date());
      const loc = pathToFileLocation(selectedPath);
      if (loc) eventBus.emit('project:saved', { location: loc });

      setProjectStore('isProjectChangedAfterSave', false);

      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      eventBus.emit('project:saveFailed', { error: error });
      return false;
    }
  }

  eventBus.emit('project:saveCancelled', {});
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
