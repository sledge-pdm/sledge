import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';

export type ImagePoolStore = {
  entries: ImagePoolEntry[];
  images: Map<string, ImagePoolImage>;
  selectedEntryId: string | undefined;
  preserveAspectRatio: boolean;
};

export const defaultImagePoolStore: ImagePoolStore = {
  entries: [],
  images: new Map(),
  selectedEntryId: undefined,
  preserveAspectRatio: true,
};
