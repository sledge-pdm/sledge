import { readFile } from '@tauri-apps/plugin-fs';

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** ローカル画像を安全に ImageBitmap へ変換 */
export async function loadLocalImage(path: string): Promise<ImageBitmap> {
  const bytes = await readFile(path);
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const bitmap = await createImageBitmap(blob);
  URL.revokeObjectURL(url);
  return bitmap;
}

export async function loadImageBuffer(bitmap: ImageBitmap) {
  const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  return imageData.data;
}
