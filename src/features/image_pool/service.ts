import { gzipDeflate, type RawPixelData } from '@sledge-pdm/core';
import { v4 } from 'uuid';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool/model';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { bufferToBlob } from '~/utils/DataUtils';
import { pathToFileLocation } from '~/utils/FileUtils';
import { fs } from '~/utils/platform';

type ImageMimeType = ImagePoolImage['mimeType'];

const DEFAULT_MIME: ImageMimeType = 'image/png';

const normalizeMimeType = (mime?: string): ImageMimeType => {
  const lower = mime?.toLowerCase();
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'image/jpeg';
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  return DEFAULT_MIME;
};

const guessMimeFromPath = (filePath?: string): ImageMimeType => {
  const ext = filePath?.split('.').pop()?.toLowerCase();
  if (!ext) return DEFAULT_MIME;
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return DEFAULT_MIME;
};

const createPersistedImage = (bytes: Uint8Array, mimeType: ImageMimeType): ImagePoolImage => {
  const deflatedBuffer = gzipDeflate(bytes);
  return { mimeType, deflatedBuffer };
};

const createEntryBase = (width: number, height: number, forceFit?: boolean): ImagePoolEntry => {
  const id = v4();
  let initialScale = forceFit ? Math.min(projectStore.canvas.size.width / width, projectStore.canvas.size.height / height) : 1;

  // at least ensure fit to prevent image overflow
  if (width > projectStore.canvas.size.width || height > projectStore.canvas.size.height) {
    initialScale = Math.min(projectStore.canvas.size.width / width, projectStore.canvas.size.height / height);
  }

  return {
    id,
    base: { width, height },
    transform: { x: 0, y: 0, scaleX: initialScale, scaleY: initialScale, rotation: 0, flipX: false, flipY: false },
    opacity: 1,
    visible: true,
  };
};

const createEntryWithImage = (
  bytes: Uint8Array,
  mimeType: ImageMimeType,
  width: number,
  height: number,
  forceFit?: boolean
): { entry: ImagePoolEntry; image: ImagePoolImage } => {
  const entry = createEntryBase(width, height, forceFit);
  const image = createPersistedImage(bytes, mimeType);
  return { entry, image };
};

export const getEntry = (id: string): ImagePoolEntry | undefined => projectStore.imagePool.entries.find((e) => e.id === id);

export async function createEntryFromLocalImage(imagePath: string, forceFit?: boolean) {
  const bytes = await fs.readFile(imagePath);
  const mimeType = guessMimeFromPath(imagePath);
  const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
  const blob = new Blob([byteArray.slice()], { type: mimeType });
  const bitmap = await createImageBitmap(blob);
  const { entry, image } = createEntryWithImage(byteArray, mimeType, bitmap.width, bitmap.height, forceFit);
  entry.descriptionName = pathToFileLocation(imagePath)?.name;
  bitmap.close();
  return { entry, image };
}

export async function createEntryFromFile(file: File, forceFit?: boolean) {
  const mimeType = normalizeMimeType(file.type);
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { width, height } = await createImageBitmap(new Blob([buffer], { type: mimeType })).then((bitmap) => {
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  });
  const { entry, image } = createEntryWithImage(buffer, mimeType, width, height, forceFit);
  entry.descriptionName = file.name;
  return { entry, image };
}

export async function createEntryFromRawBuffer(rawBuffer: RawPixelData, width: number, height: number, forceFit?: boolean) {
  const blob = await bufferToBlob({ buffer: rawBuffer, width, height });
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const { entry, image } = createEntryWithImage(buffer, 'image/png', width, height, forceFit);
  return { entry, image };
}

export function selectEntry(id?: string) {
  setProjectStore('imagePool', 'state', 'selectedEntryId', id);
}
