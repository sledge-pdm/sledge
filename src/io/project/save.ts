import { path } from '@tauri-apps/api';
import { save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { calcThumbnailSize, ThumbnailGenerator } from '~/controllers/canvas/ThumbnailGenerator';
import { addRecentFile } from '~/controllers/config/GlobalConfigController';
import { dumpProject2 } from '~/io/project/dump';
import { canvasStore, projectStore, setProjectStore } from '~/stores/ProjectStores';
import { blobToDataUrl } from '~/utils/DataUtils';
import { getFileNameAndPath } from '~/utils/PathUtils';
import getFileId from '../../utils/getFileId';
import { saveThumbnailExternal } from './thumbnail';

async function folderSelection(name?: string) {
  try {
    await mkdir('sledge', {
      baseDir: BaseDirectory.Home,
      recursive: true,
    });
  } catch (e) {
    console.warn('failed or skipped making new directory:', e);
  }

  const home = await path.homeDir();
  return await save({
    title: 'save sledge project',
    defaultPath: await path.join(home, `sledge/${name ?? projectStore.name ?? 'untitled'}.sledge`),
    filters: [{ name: 'sledge project', extensions: ['sledge'] }],
  });
}

async function saveThumbnailData(selectedPath: string) {
  const fileId = await getFileId(selectedPath);
  const { width, height } = canvasStore.canvas;
  const thumbSize = calcThumbnailSize(width, height);
  const thumbnailBlob = await new ThumbnailGenerator().generateCanvasThumbnailBlob(thumbSize.width, thumbSize.height);
  const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
  return await saveThumbnailExternal(fileId, thumbnailDataUrl);
}

export async function saveProject(name?: string, existingPath?: string) {
  let selectedPath: string | null;

  if (existingPath) {
    selectedPath = existingPath;
  } else {
    selectedPath = await folderSelection(name);
  }

  if (typeof selectedPath === 'string') {
    setProjectStore('path', selectedPath);
    const thumbpath = await saveThumbnailData(selectedPath);

    // const data = await dumpProject();
    // await writeTextFile(selectedPath, data);
    const data = await dumpProject2();
    await writeFile(selectedPath, data);
    console.log('project saved to:', selectedPath);

    setProjectStore('isProjectChangedAfterSave', false);
    addRecentFile(getFileNameAndPath(selectedPath));
  } else {
    console.log('save cancelled');
  }
}
