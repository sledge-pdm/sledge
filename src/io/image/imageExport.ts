import { pictureDir } from '@tauri-apps/api/path';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { canvasStore } from '~/stores/ProjectStores';
import { saveBlobViaTauri } from '../saveBlob';

export type exportableFileTypes = 'png' | 'jpg';

export interface CanvasExportOptions {
  format: exportableFileTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

export const defaultExportDir = async () => (await pictureDir()) + '\\sledge';

export async function exportImage(dirPath: string, fileName: string, options: CanvasExportOptions): Promise<string | undefined> {
  const canvasBlob = await getImageBlob(options);
  if (canvasBlob === undefined) return undefined;
  return await saveBlobViaTauri(canvasBlob, dirPath, `${fileName}.${options.format}`);
}

export async function getImageBlob(options: CanvasExportOptions): Promise<Blob | undefined> {
  if (webGLRenderer === undefined) return undefined;
  const { format, quality = 0.92, scale = 1 } = options;
  const { width, height } = canvasStore.canvas;

  let buffer = webGLRenderer.readPixelsAsBuffer();

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx2d = offscreen.getContext('2d')!;
  // 先に上下反転行列をセット
  ctx2d.save();
  ctx2d.scale(1, -1);
  const tmp = document.createElement('canvas');
  tmp.width = width;
  tmp.height = height;
  const tmpCtx = tmp.getContext('2d')!;
  const imgData = new ImageData(buffer, width, height);
  tmpCtx.putImageData(imgData, 0, 0);
  ctx2d.drawImage(tmp, 0, -height, width, height);
  ctx2d.restore();

  let target = offscreen;
  if (scale !== 1) {
    const scaled = document.createElement('canvas');
    scaled.width = Math.round(width * scale);
    scaled.height = Math.round(height * scale);
    const ctxScaled = scaled.getContext('2d')!;
    ctxScaled.imageSmoothingEnabled = false;
    ctxScaled.drawImage(offscreen, 0, 0, scaled.width, scaled.height);
    target = scaled;
  }

  return new Promise<Blob>((resolve, reject) => {
    target.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob returned null'));
      },
      `image/${format === 'jpg' ? 'jpeg' : 'png'}`,
      quality
    );
  });
}
