import { appCacheDir, basename, join } from '@tauri-apps/api/path';
import { copyFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import getFileId from '~/io/project/getFileId';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { canvasStore, setImagePoolStore } from '~/stores/ProjectStores';
import { loadImageMeta } from '~/utils/DataUtils';

export function setEntry(id: string, entry: ImagePoolEntry) {
  setImagePoolStore((store) => {
    store.entries.set(id, entry);
    return store;
  });
}

export function removeEntry(id: string) {
  setImagePoolStore((store) => {
    store.entries.delete(id);
    return store;
  });
}

async function createResource(originalPath: string) {
  const id = await getFileId(originalPath);

  const imagesDir = await appCacheDir(); // e.g. src-tauri/…/app
  const destName = `${id}-${await basename(originalPath)}`;
  const destFolder = await join(imagesDir, 'pool-images');
  if (!(await exists(destFolder))) {
    await mkdir(destFolder);
  }
  const destPath = await join(imagesDir, 'pool-images', destName);
  await copyFile(originalPath, destPath);

  const { width, height, blobUrl } = await loadImageMeta(destPath);

  const entry: ImagePoolEntry = {
    id,
    originalPath,
    resourcePath: destPath,
    x: 0,
    y: 0,
    scale: Math.min(canvasStore.canvas.width / width, canvasStore.canvas.height / height),
    width,
    height,
    opacity: 1,
    visible: true,
  };
  setEntry(id, entry);

  return id;
}

export function addToImagePool(imagePaths: string | string[]) {
  if (Array.isArray(imagePaths)) {
    imagePaths.forEach((path) => createResource(path));
  } else {
    createResource(imagePaths);
  }
}
