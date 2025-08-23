import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { canvasStore } from '~/stores/ProjectStores';
import { loadLocalImage } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
import getFileId from '~/utils/getFileId';

// Plain Map でエントリーを管理
const pool = new Map<string, ImagePoolEntry>();

export const getEntries = (): ImagePoolEntry[] => Array.from(pool.values());
export const getEntry = (id: string): ImagePoolEntry | undefined => pool.get(id);

export function setEntry(id: string, entry: ImagePoolEntry) {
  pool.set(id, entry);
  eventBus.emit('imagePool:entryPropChanged', { id });
}

export function updateEntryPartial(id: string, patch: Partial<ImagePoolEntry>) {
  const old = pool.get(id);
  if (!old) return;
  const updated = { ...old, ...patch } as ImagePoolEntry;
  pool.set(id, updated);
  eventBus.emit('imagePool:entryPropChanged', { id });
}

export function removeEntry(id: string) {
  if (pool.delete(id)) {
    eventBus.emit('imagePool:entriesChanged', { newEntries: getEntries() });
  }
}

export function replaceAll(entries: ImagePoolEntry[]) {
  pool.clear();
  for (const e of entries) pool.set(e.id, e);
  eventBus.emit('imagePool:entriesChanged', { newEntries: getEntries() });
}

export async function addToImagePool(imagePaths: string | string[]) {
  if (Array.isArray(imagePaths)) {
    await Promise.all(imagePaths.map((p) => createEntry(p)));
  } else {
    await createEntry(imagePaths);
  }
  eventBus.emit('imagePool:entriesChanged', { newEntries: getEntries() });
}

export async function relinkEntry(id: string, newPath: string) {
  const filename = newPath.split(/[\\/]/).pop() ?? newPath;
  updateEntryPartial(id, { originalPath: newPath, resourcePath: newPath, fileName: filename });
}

async function createEntry(originalPath: string) {
  const id = await getFileId(originalPath);

  // 画像サイズの取得（コピーせず読み込み）
  const bitmap = await loadLocalImage(originalPath);
  const width = bitmap.width;
  const height = bitmap.height;

  const entry: ImagePoolEntry = {
    id,
    originalPath,
    // 段階的移行のため resourcePath は originalPath をミラー
    resourcePath: originalPath,
    fileName: originalPath.split(/[\\/]/).pop() ?? originalPath,
    x: 0,
    y: 0,
    scale: Math.min(canvasStore.canvas.width / width, canvasStore.canvas.height / height),
    width,
    height,
    opacity: 1,
    visible: true,
  };
  pool.set(id, entry);
  return id;
}
