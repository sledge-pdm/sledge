import { pictureDir } from '@tauri-apps/api/path';
import { writeFile } from '@tauri-apps/plugin-fs';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { canvasStore } from '~/stores/ProjectStores';

export type ExportableFileTypes = 'png' | 'jpg';

export interface CanvasExportOptions {
  format: ExportableFileTypes;
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

  const buffer = webGLRenderer.readPixelsFlipped();

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx2d = offscreen.getContext('2d')!;
  const imgData = new ImageData(buffer, width, height);
  ctx2d.putImageData(imgData, 0, 0);

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

export async function saveBlobViaTauri(blob: Blob, dirPath: string, defaultName = 'export.png') {
  const buf = new Uint8Array(await blob.arrayBuffer());
  dirPath.replaceAll('/', '\\');
  dirPath = dirPath.endsWith('\\') ? dirPath : dirPath + '\\';
  await writeFile(dirPath + defaultName, buf, {});
  return dirPath + defaultName;
}
