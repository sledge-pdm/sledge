import { ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { removeImagePoolBlobUrl } from '~/features/image_pool/blobManager';
import { removeImagePoolImage, setImagePoolImage } from '~/features/image_pool/imageStore';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

export function insertImagePoolEntry(entry: ImagePoolEntry, index: number, image?: ImagePoolImage) {
  const current = projectStore.imagePool.entries;
  const next = [...current.filter((e) => e.id !== entry.id)];
  const clampedIndex = Math.min(Math.max(index, 0), next.length);
  next.splice(clampedIndex, 0, entry);
  removeImagePoolBlobUrl(entry.id);
  setProjectStore('imagePool', 'entries', next);
  if (image) {
    setImagePoolImage(entry.id, image);
  }
}

export function removeImagePoolEntry(entryId: string) {
  removeImagePoolBlobUrl(entryId);
  setProjectStore(
    'imagePool',
    'entries',
    projectStore.imagePool.entries.filter((e) => e.id !== entryId)
  );
  removeImagePoolImage(entryId);
}
