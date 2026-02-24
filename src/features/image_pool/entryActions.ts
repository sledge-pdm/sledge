import { HistoryContext, ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { removeImagePoolBlobUrl } from './blobManager';
import { registerEntryUpdate, registerImagePoolAddHistory, registerImagePoolRemoveHistory } from './historyActions';
import { getImagePoolImage, removeImagePoolImage, setImagePoolImage } from './imageStore';
import { cloneEntry, getEntry } from './service';

const setImageForEntry = (entryId: string, image: ImagePoolImage) => {
  removeImagePoolBlobUrl(entryId);
  setImagePoolImage(entryId, image);
};

const removeImageForEntry = (entryId: string) => {
  removeImagePoolBlobUrl(entryId);
  removeImagePoolImage(entryId);
};

// Insert entry with a given id (used for undo/redo to keep id stable)
export function insertEntry(entry: ImagePoolEntry, image: ImagePoolImage, options?: { register?: boolean }) {
  const newEntries = [...projectStore.imagePool.entries.filter((e) => e.id !== entry.id), entry];
  setProjectStore('imagePool', 'entries', newEntries);
  setImageForEntry(entry.id, image);

  const register = options?.register ?? true;
  if (register) {
    const index = projectStore.imagePool.entries.findIndex((e) => e.id === entry.id);
    registerImagePoolAddHistory(entry, image, index);
  }
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>, options?: { register?: boolean; context?: HistoryContext }) {
  const oldEntryIndex = projectStore.imagePool.entries.findIndex((e) => e.id === id);
  if (oldEntryIndex < 0) return;

  const shouldRegister = options?.register ?? true;
  const before = shouldRegister ? cloneEntry(projectStore.imagePool.entries[oldEntryIndex]) : undefined;
  setProjectStore('imagePool', 'entries', oldEntryIndex, patch);
  if (!shouldRegister || !before) return;

  if (options?.register && before) {
    const afterEntry = projectStore.imagePool.entries[oldEntryIndex];
    if (!afterEntry) return;
    const after = cloneEntry(afterEntry);
    registerEntryUpdate(id, before, after, options);
  }
}

export function removeEntry(id: string, options?: { register?: boolean }) {
  const entry = getEntry(id);
  if (!entry) {
    const newEntries = projectStore.imagePool.entries.filter((e) => e.id !== id);
    setProjectStore('imagePool', 'entries', newEntries);
    return;
  }
  const index = projectStore.imagePool.entries.findIndex((e) => e.id === id);
  const image = getImagePoolImage(id);

  const newEntries = projectStore.imagePool.entries.filter((e) => e.id !== id);
  setProjectStore('imagePool', 'entries', newEntries);
  removeImageForEntry(id);
  if (projectStore.imagePool.state.selectedEntryId === id) {
    const nextIndex = index - 1;
    if (0 <= nextIndex && nextIndex < newEntries.length) {
      setProjectStore('imagePool', 'state', 'selectedEntryId', newEntries[nextIndex].id);
    } else {
      setProjectStore('imagePool', 'state', 'selectedEntryId', undefined);
    }
  }

  const register = options?.register ?? true;
  if (register) {
    registerImagePoolRemoveHistory(entry, image, index);
  }
}

export function showEntry(id: string) {
  const entry = getEntry(id);
  if (entry && !entry.visible) {
    updateEntryPartial(
      id,
      { visible: true },
      { register: true, context: { icon: '/assets/icons/actions/image.png', description: `show image / ${entry.descriptionName ?? entry.id}` } }
    );
  }
}

export function hideEntry(id: string) {
  const entry = getEntry(id);
  if (entry && entry.visible) {
    updateEntryPartial(
      id,
      { visible: false },
      { register: true, context: { icon: '/assets/icons/actions/image.png', description: `hide image / ${entry.descriptionName ?? entry.id}` } }
    );
  }
}
