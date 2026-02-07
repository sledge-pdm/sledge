import { ImagePoolImage } from '@sledge-pdm/core';
import { createSignal } from 'solid-js';

export const [imagePoolImages, setImagePoolImages] = createSignal<Map<string, ImagePoolImage>>(new Map());

export const getImagePoolImage = (entryId: string): ImagePoolImage | undefined => imagePoolImages().get(entryId);

export const setImagePoolImage = (entryId: string, image: ImagePoolImage) => {
  const next = new Map(imagePoolImages());
  next.set(entryId, image);
  setImagePoolImages(next);
};

export const removeImagePoolImage = (entryId: string) => {
  const next = new Map(imagePoolImages());
  next.delete(entryId);
  setImagePoolImages(next);
};
