import type { ClipboardImage } from './image';

export interface ClipboardPlatform {
  readImage(): Promise<ClipboardImage>;
  readText(): Promise<string>;
  writeImage(image: ClipboardImage): Promise<void>;
  writeText(text: string): Promise<void>;
}
