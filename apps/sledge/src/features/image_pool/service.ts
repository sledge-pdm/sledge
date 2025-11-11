import type { RawPixelData } from '@sledge/anvil';
import { AntialiasMode, rawToWebp, webpToRaw } from '@sledge/anvil';
import { v4 } from 'uuid';
import { normalizeRotation } from '~/features/canvas';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { ImagePoolEntry } from '~/features/image_pool/model';
import { activeLayer } from '~/features/layer';
import { flushPatch, getBufferPointer, getHeight, getWidth, registerWholeChange } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
import { pathToFileLocation } from '~/utils/FileUtils';

export const getEntry = (id: string): ImagePoolEntry | undefined => imagePoolStore.entries.find((e) => e.id === id);

// Insert entry with a given id (used for undo/redo to keep id stable)
export function insertEntry(entry: ImagePoolEntry, noDiff?: boolean) {
  const oldEntries = imagePoolStore.entries.slice();

  setImagePoolStore('entries', [...imagePoolStore.entries.filter((e) => e.id !== entry.id), entry]);

  if (!noDiff) {
    projectHistoryController.addAction(
      new ImagePoolHistoryAction({
        kind: 'add',
        oldEntries,
        newEntries: imagePoolStore.entries.slice(),
        context: { from: 'ImagePoolController.insertEntry' },
      })
    );
  }
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>, noDiff?: boolean) {
  let oldEntryIndex = imagePoolStore.entries.findIndex((e) => e.id === id);
  if (oldEntryIndex < 0) return;

  setImagePoolStore('entries', oldEntryIndex, patch);
}

export function removeEntry(id: string, noDiff?: boolean) {
  const oldEntries = imagePoolStore.entries.slice();
  const entry = getEntry(id);
  if (!entry) {
    console.warn(`ImagePoolController.removeEntry: Entry not found for id ${id}`);
    return;
  }

  if (imagePoolStore.entries.some((e) => e.id === id)) {
    setImagePoolStore(
      'entries',
      imagePoolStore.entries.filter((e) => e.id !== id)
    );

    if (imagePoolStore.selectedEntryId === id) {
      const index = oldEntries.findIndex((e) => e.id === id);
      const nextIndex = index - 1;
      if (0 <= nextIndex && nextIndex < imagePoolStore.entries.length) {
        selectEntry(oldEntries[nextIndex].id);
      } else {
        selectEntry(undefined);
      }
    }
    if (!noDiff)
      projectHistoryController.addAction(
        new ImagePoolHistoryAction({
          kind: 'remove',
          oldEntries,
          newEntries: imagePoolStore.entries.slice(),
          context: { from: 'ImagePoolController.removeEntry' },
        })
      );
  }
}

export async function addImagesFromLocal(imagePaths: string | string[], forceFit?: boolean) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(
      imagePaths.map(async (p) => {
        const entry = await createEntryFromLocalImage(p, forceFit);
        insertEntry(entry, false);
      })
    );
  } else {
    const entry = await createEntryFromLocalImage(imagePaths, forceFit);
    insertEntry(entry, false);
  }
}

export async function addImagesFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const entry = await createEntryFromRawBuffer(rawBuffer, width, height, forceFit);
  insertEntry(entry, false);
}

export async function transferToCurrentLayer(entryId: string, removeAfter: boolean) {
  const active = activeLayer();
  if (!active) return;

  try {
    transferToLayer(active.id, entryId);
    if (removeAfter) removeEntry(entryId); // ImagePool から削除
  } catch (e) {
    console.error(e);
  }
}

async function transferToLayer(layerId: string, entryId: string) {
  const layerBuf = getBufferPointer(layerId);
  const layerW = getWidth(layerId);
  const layerH = getHeight(layerId);
  const entry = getEntry(entryId);
  const anvil = getAnvilOf(layerId);
  if (!layerW || !layerH || !layerBuf || !entry || !anvil) return;

  const rawEntryBuffer = webpToRaw(entry.webpBuffer, entry.base.width, entry.base.height);

  registerWholeChange(layerId, layerBuf);

  const offsetX = Math.round(entry.transform.x);
  const offsetY = Math.round(entry.transform.y);

  // calculate nearest scale to match integer width/height
  const targetWidth = Math.round(entry.base.width * entry.transform.scaleX);
  const targetHeight = Math.round(entry.base.height * entry.transform.scaleY);
  const scaleX = targetWidth / entry.base.width;
  const scaleY = targetHeight / entry.base.height;

  const rotate = normalizeRotation(entry.transform.rotation);

  anvil.transferFromRaw(rawEntryBuffer, entry.base.width, entry.base.height, {
    offsetX,
    offsetY,
    scaleX,
    scaleY,
    rotate,
    flipX: entry.transform.flipX,
    flipY: entry.transform.flipY,
    antialiasMode: AntialiasMode.Nearest,
  });

  const patch = flushPatch(layerId);
  if (patch) {
    projectHistoryController.addAction(
      new AnvilLayerHistoryAction({
        layerId,
        patch,
        context: { tool: 'image' },
      })
    );
  }
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Image Transfer to Layer(${layerId})` });
  eventBus.emit('preview:requestUpdate', { layerId });
}

function createEntry(webpBuffer: Uint8Array, width: number, height: number, forceFit?: boolean) {
  const id = v4();
  let initialScale = forceFit ? Math.min(canvasStore.canvas.width / width, canvasStore.canvas.height / height) : 1;

  // at least ensure fit to prevent image overflow
  if (width > canvasStore.canvas.width || height > canvasStore.canvas.height) {
    initialScale = Math.min(canvasStore.canvas.width / width, canvasStore.canvas.height / height);
  }

  const entry: ImagePoolEntry = {
    id,
    webpBuffer,
    base: { width, height },
    transform: { x: 0, y: 0, scaleX: initialScale, scaleY: initialScale, rotation: 0, flipX: false, flipY: false },
    opacity: 1,
    visible: true,
  };
  return entry;
}

export async function createEntryFromLocalImage(imagePath: string, forceFit?: boolean) {
  const bitmap = await loadLocalImage(imagePath);
  const width = bitmap.width;
  const height = bitmap.height;
  const imageData = await loadImageData(bitmap);
  const webpBuffer = rawToWebp(imageData.data, width, height);
  bitmap.close();
  const entry = createEntry(webpBuffer, width, height, forceFit);
  entry.descriptionName = pathToFileLocation(imagePath)?.name;
  return entry;
}

export async function createEntryFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const webpBuffer = rawToWebp(rawBuffer, width, height);
  const entry = createEntry(webpBuffer, width, height, forceFit);
  return entry;
}

export function selectEntry(id?: string) {
  setImagePoolStore('selectedEntryId', id);
}

export function showEntry(id: string) {
  const entry = getEntry(id);
  if (entry && !entry.visible) {
    updateEntryPartial(id, {
      visible: true,
    });
  }
}

export function hideEntry(id: string) {
  const entry = getEntry(id);
  if (entry && entry.visible) {
    updateEntryPartial(id, {
      visible: false,
    });
  }
}
