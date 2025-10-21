import { transferToLayer } from '~/appliers/ImageTransferApplier';
import { projectHistoryController } from '~/features/history';
import { ImagePoolEntryPropsHistoryAction } from '~/features/history/actions/ImagePoolEntryPropsHistoryAction';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { ImagePoolEntry } from '~/features/image_pool/model';
import { activeLayer } from '~/features/layer';
import { canvasStore, imagePoolStore, setImagePoolStore } from '~/stores/ProjectStores';
import { loadLocalImage } from '~/utils/DataUtils';
import { getFileUniqueId } from '~/utils/FileUtils';

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
        context: { from: 'ImagePoolController.removeEntry' },
      })
    );
  }
}

export function setEntry(id: string, entry: ImagePoolEntry) {
  setImagePoolStore('entries', [...imagePoolStore.entries.filter((e) => e.id !== entry.id), entry]);
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>, noDiff?: boolean) {
  let index = imagePoolStore.entries.findIndex((e) => e.id === id);
  if (index === -1) return;

  const old = { ...imagePoolStore.entries[index] };
  const updated = { ...old, ...patch } as ImagePoolEntry;

  setImagePoolStore('entries', index, updated);

  if (!noDiff) {
    projectHistoryController.addAction(
      new ImagePoolEntryPropsHistoryAction({
        entryId: id,
        oldEntryProps: old,
        newEntryProps: updated,
        context: { from: 'ImagePoolController.updateEntryPartial' },
      })
    );
  }
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

export async function addToImagePool(imagePaths: string | string[]) {
  const old = imagePoolStore.entries.slice();
  if (Array.isArray(imagePaths)) {
    const entries: ImagePoolEntry[] = await Promise.all(imagePaths.map((p) => createEntry(p)));
  } else {
    const entry = await createEntry(imagePaths);
  }

  projectHistoryController.addAction(
    new ImagePoolHistoryAction({
      kind: 'add',
      oldEntries: old,
      newEntries: imagePoolStore.entries.slice(),
      context: { from: 'ImagePoolController.addToImagePool' },
    })
  );
}

export async function transferToCurrentLayer(id: string, removeAfter: boolean) {
  const active = activeLayer(); // いま選択中のレイヤー
  if (!active) return;

  try {
    const current = getEntry(id);
    if (!current) return;
    await transferToLayer({
      entry: {
        transform: current.transform,
        base: current.base,
        imagePath: current.imagePath,
      },
      targetLayerId: active.id,
    });
    if (removeAfter) removeEntry(current.id); // ImagePool から削除
  } catch (e) {
    console.error(e);
  }
}

async function createEntry(imagePath: string) {
  const id = await getFileUniqueId(imagePath);

  const bitmap = await loadLocalImage(imagePath);
  const width = bitmap.width;
  const height = bitmap.height;

  bitmap.close();

  const initialScale = Math.min(canvasStore.canvas.width / width, canvasStore.canvas.height / height);
  const entry: ImagePoolEntry = {
    id,
    imagePath,
    base: { width, height },
    transform: { x: 0, y: 0, scaleX: initialScale, scaleY: initialScale },
    opacity: 1,
    visible: true,
  };

  insertEntry(entry);
  return entry;
}

export function selectEntry(id?: string) {
  setImagePoolStore('selectedEntryId', id);
}

export function showEntry(id: string) {
  const entry = getEntry(id);
  if (entry && !entry.visible) {
    entry.visible = true;
    projectHistoryController.addAction(
      new ImagePoolEntryPropsHistoryAction({
        entryId: id,
        oldEntryProps: {
          ...entry,
          visible: false,
        },
        newEntryProps: {
          ...entry,
          visible: true,
        },
        context: { from: 'ImagePoolController.showEntry' },
      })
    );
  }
}

export function hideEntry(id: string) {
  const entry = getEntry(id);
  if (entry && entry.visible) {
    entry.visible = false;
    projectHistoryController.addAction(
      new ImagePoolEntryPropsHistoryAction({
        entryId: id,
        oldEntryProps: {
          ...entry,
          visible: true,
        },
        newEntryProps: {
          ...entry,
          visible: false,
        },
        context: { from: 'ImagePoolController.hideEntry' },
      })
    );
  }
}
