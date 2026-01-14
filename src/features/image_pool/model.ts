export type ImagePoolEntry = {
  id: string;
  base: { width: number; height: number };
  transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number; flipX: boolean; flipY: boolean };
  opacity: number;
  visible: boolean;
  descriptionName?: string;
};

export type ImagePoolImagePersisted = { mimeType: 'image/png' | 'image/jpeg' | 'image/webp'; deflatedBuffer: Uint8Array };

export type ImagePoolImage = ImagePoolImagePersisted & {
  blobUrl: string;
};

export type ImagePoolState = {
  selectedEntryId: string | undefined;
  preserveAspectRatio: boolean;
};
