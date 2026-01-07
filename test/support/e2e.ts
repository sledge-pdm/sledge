export type E2EImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export async function loadImageData(path: string | URL): Promise<E2EImage> {
  const url = typeof path === 'string' ? new URL(path, import.meta.url) : path;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`E2E: failed to load image ${url.href}`);
  }
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('E2E: 2D canvas context not available');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: new Uint8Array(imageData.data), width: canvas.width, height: canvas.height };
}
