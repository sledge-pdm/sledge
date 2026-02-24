import { type RawPixelData } from '@sledge-pdm/core';
import { logUserInfo } from '~/features/log/service';
import { insertEntry } from './entryActions';
import { createEntryFromFile, createEntryFromLocalImage, createEntryFromRawBuffer } from './service';

export async function addImagesFromLocal(imagePaths: string | string[], forceFit?: boolean) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(
      imagePaths.map(async (p) => {
        const { entry, image } = await createEntryFromLocalImage(p, forceFit);
        insertEntry(entry, image);
      })
    );
    if (imagePaths.length > 0) {
      logUserInfo(`Added ${imagePaths.length} image(s) to image pool.`);
    }
  } else {
    const { entry, image } = await createEntryFromLocalImage(imagePaths, forceFit);
    insertEntry(entry, image);
    logUserInfo('Image added to image pool.');
  }
}

export async function addImagesFromFiles(files: File[], forceFit?: boolean) {
  await Promise.all(
    files.map(async (file) => {
      const { entry, image } = await createEntryFromFile(file, forceFit);
      insertEntry(entry, image);
    })
  );
  if (files.length > 0) {
    logUserInfo(`Added ${files.length} image(s) to image pool.`);
  }
}

export async function addImagesFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const { entry, image } = await createEntryFromRawBuffer(rawBuffer, width, height, forceFit);
  insertEntry(entry, image);
  logUserInfo('Image added to image pool.');
}
