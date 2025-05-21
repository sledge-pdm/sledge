import { pictureDir } from '@tauri-apps/api/path';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { saveBlobViaTauri } from '../saveBlob';

export type exportableFileTypes = 'png' | 'jpg';

export interface CanvasExportOptions {
  format: exportableFileTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

export const defaultExportDir = async () => (await pictureDir()) + '\\sledge';

export async function exportCanvas(dirPath: string, fileName: string, options: CanvasExportOptions): Promise<string | undefined> {
  const canvasBlob = await getCanvasBlob(options);
  if (canvasBlob === undefined) return undefined;
  return await saveBlobViaTauri(canvasBlob, dirPath, `${fileName}.${options.format}`);
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
      `image/${format === 'jpg' ? 'jpeg' : format}`,
      quality
    );
  });
}
