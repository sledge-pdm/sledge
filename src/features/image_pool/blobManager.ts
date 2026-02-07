import { gzipInflate, ImagePoolImage } from '@sledge-pdm/core';
import { createSignal } from 'solid-js';
import { getImagePoolImage } from './imageStore';

const [imagePoolBlobUrls, setImagePoolBlobUrls] = createSignal<Map<string, string>>(new Map());

const createBlobUrl = (image: ImagePoolImage): string => {
  const inflated = gzipInflate(image.deflatedBuffer) as Uint8Array<ArrayBuffer>;
  return URL.createObjectURL(new Blob([inflated], { type: image.mimeType }));
};

export const getImagePoolBlobUrl = (entryId: string): string | undefined => {
  const current = imagePoolBlobUrls();
  const existing = current.get(entryId);
  if (existing) return existing;

  const image = getImagePoolImage(entryId);
  if (!image) return undefined;

  const url = createBlobUrl(image);
  const next = new Map(current);
  next.set(entryId, url);
  setImagePoolBlobUrls(next);
  return url;
};

export const removeImagePoolBlobUrl = (entryId: string) => {
  const current = imagePoolBlobUrls();
  const url = current.get(entryId);
  if (!url) return;
  URL.revokeObjectURL(url);
  const next = new Map(current);
  next.delete(entryId);
  setImagePoolBlobUrls(next);
};

export const clearImagePoolBlobUrls = () => {
  imagePoolBlobUrls().forEach((url) => URL.revokeObjectURL(url));
  setImagePoolBlobUrls(new Map());
};
