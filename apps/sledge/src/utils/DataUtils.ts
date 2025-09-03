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
  const blob = new Blob([bytes.slice()]);
  const url = URL.createObjectURL(blob);
  const bitmap = await createImageBitmap(blob);
  URL.revokeObjectURL(url);
  return bitmap;
}

export async function loadImageData(bitmap: ImageBitmap): Promise<ImageData> {
  const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  return imageData;
}

export async function bufferToBlob({
  buffer,
  width,
  height,
}: {
  buffer: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
}): Promise<Blob> {
  // OffscreenCanvasを使ってバッファから画像を作成
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // ImageDataを作成
  const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
  ctx.putImageData(imageData, 0, 0);

  // Blobに変換
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blob;
}

export async function downloadBufferAsPNG(
  buffer: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  filename: string = 'debug-buffer.png'
): Promise<string> {
  const blob = await bufferToBlob({ buffer, width, height });

  // ダウンロード用のリンクを作成
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // ダウンロード実行
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // URLをクリーンアップ
  URL.revokeObjectURL(url);

  return url;
}

/**
 * デバッグ用：バッファを即座にPNGとしてダウンロード
 */
export function debugDownloadBuffer(buffer: Uint8Array | Uint8ClampedArray, width: number, height: number, label: string = 'debug') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${label}-${timestamp}.png`;

  downloadBufferAsPNG(buffer, width, height, filename).catch(console.error);
  console.log(`Debug: Downloaded buffer as ${filename} (${width}x${height})`);
}
