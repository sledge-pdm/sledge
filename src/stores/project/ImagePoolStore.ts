import { ImagePoolEntry } from '~/features/image_pool';

export type ImagePoolStore = {
  entries: ImagePoolEntry[];
  selectedEntryId: string | undefined;
  preserveAspectRatio: boolean;
};

export const defaultImagePoolStore: ImagePoolStore = {
  entries: [],
  selectedEntryId: undefined,
  preserveAspectRatio: true,
};
