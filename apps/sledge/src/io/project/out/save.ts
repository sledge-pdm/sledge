import { FileLocation } from '@sledge/core';
import { path } from '@tauri-apps/api';
import { appDataDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { calcThumbnailSize, ThumbnailGenerator } from '~/features/canvas/ThumbnailGenerator';
import { setLocation as setSavedLocation } from '~/features/config';
import { addRecentFile } from '~/features/config/RecentFileController';
import { dumpProject } from '~/io/project/out/dump';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { canvasStore, setProjectStore } from '~/stores/ProjectStores';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
import { getFileNameWithoutExtension, getFileUniqueId, join, pathToFileLocation } from '~/utils/FileUtils';

async function folderSelection(location?: FileLocation) {
  try {
    await mkdir('sledge', {
      baseDir: BaseDirectory.Home,
      recursive: true,
    });
  } catch (e) {
    console.warn('failed or skipped making new directory:', e);
  }
  const home = await path.homeDir();

  const nameWOExtension = location?.name ? getFileNameWithoutExtension(location?.name) : 'new project';
  let defaultPath = '';
  console.log('path', location?.path);
  if (location?.path) {
    // if path is provided, open the path as default
    defaultPath = join(location?.path, `${nameWOExtension}`);
  } else {
    // if path is not defined
    defaultPath = join(home, `sledge/${nameWOExtension}`);
  }

  console.log('default save path:', defaultPath);

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

  console.log(fileNameWOExtension);
  console.log(fileStore);

  if (fileStore.openAs === 'project' && existingPath && name) {
    // overwrite existing project
    selectedPath = join(existingPath, name);
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

export const thumbnailDir = async () => join(await appDataDir(), 'thumbnails');
export const thumbnailPath = async (fileId: string) => join(await appDataDir(), 'thumbnails', fileId);

export async function saveThumbnailExternal(fileId: string, dataUrl: string): Promise<string> {
  const dir = await thumbnailDir();
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  const path = join(dir, `${fileId}.png`);
  const bytes = dataUrlToBytes(dataUrl);
  await writeFile(path, bytes);
  return path;
}
