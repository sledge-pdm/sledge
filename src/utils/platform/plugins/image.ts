export type ImageSize = { width: number; height: number };

export interface ClipboardImage {
  rgba(): Promise<Uint8Array>;
  size(): Promise<ImageSize>;
  close(): void;
}

export interface ImagePlatform {
  create(data: Uint8Array, width: number, height: number): Promise<ClipboardImage>;
}
