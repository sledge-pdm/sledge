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

export async function loadImageMeta(path: string): Promise<{
  width: number;
  height: number;
  blobUrl: string; // ImagePool サムネ用
}> {
  const bytes = await readFile(path);
  const blob = new Blob([bytes]);
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  bitmap.close(); // GPU テクスチャ解放
  const blobUrl = URL.createObjectURL(blob); // 同一オリジン
  return { width, height, blobUrl };
}
