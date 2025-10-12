export type ImagePoolStore = {
  selectedEntryId: string | undefined;
  preserveAspectRatio: boolean;
};

export const defaultImagePoolStore: ImagePoolStore = {
  selectedEntryId: undefined,
  preserveAspectRatio: true,
};
