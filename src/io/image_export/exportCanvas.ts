import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { saveBlobViaTauri } from '../saveBlob';

export interface CanvasExportOptions {
  format: 'png' | 'jpeg';
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale?: number; // 1（そのまま）～10 など
}

export async function exportCanvas(name: string, options: CanvasExportOptions): Promise<boolean> {
  const canvasBlob = await getCanvasBlob(options);
  if (canvasBlob === undefined) return false;
  await saveBlobViaTauri(canvasBlob, `${name}.${options.format}`);
  return true;
}

export async function getCanvasBlob(options: CanvasExportOptions): Promise<Blob | undefined> {
  if (webGLRenderer === undefined) return undefined;
  const { format, quality = 0.92, scale = 1 } = options;
  const src = webGLRenderer.getCanvasElement();

  let targetCanvas: HTMLCanvasElement = src;
  if (scale !== 1) {
    const off = document.createElement('canvas');
    off.width = Math.round(src.width * scale);
    off.height = Math.round(src.height * scale);
    const ctx = off.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; //追加
    ctx.drawImage(src, 0, 0, off.width, off.height);
    targetCanvas = off;
  }

  return new Promise<Blob>((resolve, reject) => {
    targetCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      `image/${format}`,
      quality
    );
  });
}
