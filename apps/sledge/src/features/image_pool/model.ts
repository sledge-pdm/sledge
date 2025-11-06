export type ImagePoolEntry = {
  id: string;
  originalPath?: string; // original image file path (deprecated)
  descriptionName?: string;

  webpBuffer: Uint8Array; // webp-compressed image buffer
  base: { width: number; height: number };

  transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number };

  opacity: number;
  visible: boolean;
};
