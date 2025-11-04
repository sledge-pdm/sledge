import { rawToWebp, transferBufferInstant, webpToRaw } from '@sledge/anvil';
import { v4 } from 'uuid';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { ImagePoolEntry } from '~/features/image_pool/model';
import { activeLayer } from '~/features/layer';
import { flushPatch, getBufferPointer, getHeight, getWidth, registerWholeChange } from '~/features/layer/anvil/AnvilController';
import { canvasStore, imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';

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

    if (imagePoolStore.selectedEntryId === id) selectEntry(undefined);
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

export async function addImagesFromLocal(imagePaths: string | string[]) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(
      imagePaths.map(async (p) => {
        const entry = await createEntryFromLocalImage(p);
        insertEntry(entry, false);
      })
    );
  } else {
    const entry = await createEntryFromLocalImage(imagePaths);
    insertEntry(entry, false);
  }
}

export async function addImagesFromRawBuffer(rawBuffer: Uint8ClampedArray, width: number, height: number) {
  const entry = await createEntryFromRawBuffer(rawBuffer, width, height);
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
  if (!layerW || !layerH || !layerBuf || !entry) return;

  const rawEntryBuffer = webpToRaw(entry.webpBuffer, entry.base.width, entry.base.height);

  registerWholeChange(layerId, layerBuf);

  transferBufferInstant(new Uint8ClampedArray(rawEntryBuffer.buffer), entry.base.width, entry.base.height, layerBuf, layerW, layerH, {
    offsetX: entry.transform.x,
    offsetY: entry.transform.y,
    scaleX: entry.transform.scaleX,
    scaleY: entry.transform.scaleY,
    rotate: entry.transform.rotation,
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

async function createEntry(webpBuffer: Uint8Array, width: number, height: number) {
  const id = v4();
  const initialScale = Math.min(canvasStore.canvas.width / width, canvasStore.canvas.height / height);
  const entry: ImagePoolEntry = {
    id,
    webpBuffer,
    base: { width, height },
    transform: { x: 0, y: 0, scaleX: initialScale, scaleY: initialScale, rotation: 0 },
    opacity: 1,
    visible: true,
  };
  return entry;
}

async function createEntryFromLocalImage(imagePath: string) {
  const bitmap = await loadLocalImage(imagePath);
  const width = bitmap.width;
  const height = bitmap.height;
  const imageData = await loadImageData(bitmap);
  const webpBuffer = rawToWebp(imageData.data, width, height);
  bitmap.close();
  const entry = createEntry(webpBuffer, width, height);
  return entry;
}

async function createEntryFromRawBuffer(rawBuffer: Uint8ClampedArray, width: number, height: number) {
  const webpBuffer = rawToWebp(rawBuffer, width, height);
  const entry = createEntry(webpBuffer, width, height);
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
