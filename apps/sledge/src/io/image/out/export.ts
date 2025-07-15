import { create_opacity_mask, mask_to_path } from '@sledge/wasm';
import { pictureDir } from '@tauri-apps/api/path';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { canvasStore } from '~/stores/ProjectStores';

export type ExportableFileTypes = 'png' | 'jpg' | 'svg';

export interface CanvasExportOptions {
  format: ExportableFileTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

export const defaultExportDir = async () => {
  const dir = (await pictureDir()) + '\\sledge';
  if (!exists(dir)) {
    await mkdir(dir, { recursive: true });
  }

  return dir;
};

export async function exportImage(dirPath: string, fileName: string, options: CanvasExportOptions): Promise<string | undefined> {
  let canvasBlob: Blob | undefined;
  if (options.format === 'svg') {
    canvasBlob = await getSVGBlob(options);
  } else {
    canvasBlob = await getImageBlob(options);
  }

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

export async function getSVGBlob(options: CanvasExportOptions): Promise<Blob | undefined> {
  if (webGLRenderer === undefined) return undefined;
  const { width, height } = canvasStore.canvas;
  const { scale = 1 } = options;

  // 64x64以内の制限チェック
  if (width > 128 || height > 128) {
    console.warn('SVG export is only supported for images 128x128 or smaller');
    return undefined;
  }

  const buffer = webGLRenderer.readPixelsFlipped();

  // wasmを使って不透明部分のマスクを作成
  const mask = create_opacity_mask(new Uint8Array(buffer.buffer), width, height);

  // wasmを使ってSVGパスを生成
  const svgPath = mask_to_path(mask, width, height, 0, 0);

  // スケールを適用したサイズ
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  // SVGドキュメントを作成（viewBoxは元のサイズ、width/heightはスケール適用）
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="clipPath">
    <path d="${svgPath}" fill="black" />
  </clipPath>
  <path d="${svgPath}" fill="black" />
</svg>`;

  return new Blob([svgContent], { type: 'image/svg+xml' });
}

export async function saveBlobViaTauri(blob: Blob, dirPath: string, defaultName = 'export.png') {
  const buf = new Uint8Array(await blob.arrayBuffer());
  dirPath.replaceAll('/', '\\');
  dirPath = dirPath.endsWith('\\') ? dirPath : dirPath + '\\';
  await writeFile(dirPath + defaultName, buf, {});
  return dirPath + defaultName;
}
