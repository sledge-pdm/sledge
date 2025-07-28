import { path } from '@tauri-apps/api';
import { appDataDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { calcThumbnailSize, ThumbnailGenerator } from '~/controllers/canvas/ThumbnailGenerator';
import { addRecentFile } from '~/controllers/config/RecentFileController';
import { dumpProject } from '~/io/project/out/dump';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { canvasStore, setProjectStore } from '~/stores/ProjectStores';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { PathToFileLocation } from '~/utils/PathUtils';
import getFileId from '../../../utils/getFileId';

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
    defaultPath: await path.join(home, `sledge/${name ?? fileStore.location.name ?? 'untitled'}.sledge`),
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
    setFileStore('location', 'path', selectedPath);
    const thumbpath = await saveThumbnailData(selectedPath);

    // const data = await dumpProject();
    // await writeTextFile(selectedPath, data);
    const data = await dumpProject();
    await writeFile(selectedPath, data);
    console.log('project saved to:', selectedPath);

    setProjectStore('isProjectChangedAfterSave', false);
    addRecentFile(PathToFileLocation(selectedPath));
  } else {
    console.log('save cancelled');
  }
}

export const thumbnailDir = async () => (await appDataDir()) + '\\sledge\\thumbnails\\';
export const thumbnailPath = async (fileId: string) => (await appDataDir()) + '\\sledge\\thumbnails\\' + fileId;

export async function saveThumbnailExternal(fileId: string, dataUrl: string): Promise<string> {
  const dir = (await appDataDir()) + '\\sledge\\thumbnails\\';
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  const path = `${dir}${fileId}.png`;
  const bytes = dataUrlToBytes(dataUrl);
  await writeFile(path, bytes);
  return path;
}
