import { appCacheDir, basename, join } from '@tauri-apps/api/path';
import { copyFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import genFileId from '~/io/project/genFileId';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { emitEvent } from '~/utils/TauriUtils';

class ImagePoolController {
  private entries = new Map<string, ImagePoolEntry>();

  getEntries() {
    return this.entries;
  }

  setEntry(id: string, entry: ImagePoolEntry) {
    const result = this.entries.set(id, entry);
    emitEvent('onImagePoolEntryChanged', { id, entry });
    return result;
  }

  removeEntry(id: string) {
    const result = this.entries.delete(id);
    emitEvent('onImagePoolChanged', { entries: this.entries });
    return result;
  }

  async importImage(originalPath: string) {
    const id = await genFileId(originalPath);

    const imagesDir = await appCacheDir(); // e.g. src-tauri/…/app
    const destName = `${id}-${await basename(originalPath)}`;
    const destFolder = await join(imagesDir, 'pool-images');
    if (!(await exists(destFolder))) {
      await mkdir(destFolder);
    }
    const destPath = await join(imagesDir, 'pool-images', destName);
    await copyFile(originalPath, destPath);

    const entry: ImagePoolEntry = {
      id,
      originalPath,
      resourcePath: destPath,
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
    };
    this.entries.set(id, entry);

    await emitEvent('onImagePoolChanged', { entries: this.entries });

    return id;
  }
}

export const imagePoolController = new ImagePoolController();

export function addToImagePool(imagePaths: string | string[]) {
  if (Array.isArray(imagePaths)) {
    imagePaths.forEach((path) => imagePoolController.importImage(path));
  } else {
    imagePoolController.importImage(imagePaths);
  }
}
