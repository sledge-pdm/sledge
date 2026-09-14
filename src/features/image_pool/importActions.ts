import { type RawPixelData } from '@sledge-pdm/core';
import { runExclusive } from '~/features/busy';
import { openImageImportDialog } from '~/features/io/image_pool/import';
import { logUserInfo } from '~/features/log/service';
import { settleAll } from '~/utils/Async';
import { insertEntry } from './entryActions';
import { createEntryFromFile, createEntryFromLocalImage, createEntryFromRawBuffer } from './service';

export async function addImagesFromLocal(imagePaths: string | string[], forceFit?: boolean) {
  await runExclusive('imageImport', async () => {
    if (Array.isArray(imagePaths)) {
      // settleAll rather than Promise.all: a failing image must not end this operation while the others are
      // still decoding, or the window would be given back with their insertEntry calls still to come.
      await settleAll(
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
  });
}

export async function addImagesFromFiles(files: File[], forceFit?: boolean) {
  await runExclusive('imageImport', async () => {
    await settleAll(
      files.map(async (file) => {
        const { entry, image } = await createEntryFromFile(file, forceFit);
        insertEntry(entry, image);
      })
    );
    if (files.length > 0) {
      logUserInfo(`Added ${files.length} image(s) to image pool.`);
    }
  });
}

/**
 * @description ask for image files and add what the user picks.
 *
 *   the picker is inside the operation, not before it: an import that only took the window once a file was
 *   chosen would leave the project open to editing - and to a save - for as long as the dialog was up.
 */
export async function importImagesFromDialog(forceFit?: boolean) {
  await runExclusive(
    'imageImport',
    async (handle) => {
      const picked = await openImageImportDialog();
      if (picked === undefined) return;

      // files are chosen, so from here this is work rather than a question. an import the user backed out
      // of never puts a modal up at all.
      handle.presentDialog();

      const paths = Array.isArray(picked) ? picked : [picked];
      await settleAll(
        paths.map(async (p) => {
          const { entry, image } = await createEntryFromLocalImage(p, forceFit);
          insertEntry(entry, image);
        })
      );
      if (paths.length > 0) {
        logUserInfo(`Added ${paths.length} image(s) to image pool.`);
      }
    },
    // the picker is modal to this window already; ours would only sit behind it while the user browses.
    { deferDialog: true }
  );
}

export async function addImagesFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  await runExclusive('imageImport', async () => {
    const { entry, image } = await createEntryFromRawBuffer(rawBuffer, width, height, forceFit);
    insertEntry(entry, image);
    logUserInfo('Image added to image pool.');
  });
}
