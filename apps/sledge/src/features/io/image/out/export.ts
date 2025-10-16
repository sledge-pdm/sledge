import { rawToWebp } from '@sledge/anvil';
import { FileLocation } from '@sledge/core';
import { create_opacity_mask, mask_to_path } from '@sledge/wasm';
import { pictureDir } from '@tauri-apps/api/path';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { convertToExtension, convertToMimetype as convertToMimeType, ExportableFileTypes } from '~/features/io/FileExtensions';
import { setLastSettingsStore } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { join } from '~/utils/FileUtils';

export interface CanvasExportOptions {
  format: ExportableFileTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

export const defaultExportDir = async () => {
  const dir = join(await pictureDir(), 'sledge');
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }

  return dir;
};

export async function exportImage(dirPath: string, fileName: string, options: CanvasExportOptions): Promise<FileLocation | undefined> {
  let canvasBlob: Blob | undefined;
  if (options.format === 'svg') {
    canvasBlob = await getSVGBlob(options);
  } else if ((options.format = 'webp_lossless')) {
    if (!webGLRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer = webGLRenderer.readPixelsFlipped();
    const webpBuffer = rawToWebp(new Uint8Array(buffer.buffer), canvasStore.canvas.width, canvasStore.canvas.height);
    canvasBlob = new Blob([new Uint8ClampedArray(webpBuffer)], { type: 'image/webp' });
  } else {
    canvasBlob = await getImageBlob(options);
  }

  if (canvasBlob === undefined) throw new Error('Export Error: Failed to create canvas image.');

  const ext = convertToExtension(options.format);

  return await saveBlobViaTauri(canvasBlob, dirPath, `${fileName}.${ext}`);
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
  const imgData = new ImageData(buffer.slice(), width, height);
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

  const mimeType = convertToMimeType(format);

  if (!mimeType) {
    throw new Error('Export Error: Mime Type not found.');
  }
  return new Promise<Blob>((resolve, reject) => {
    target.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export Error: toBlob returned null'));
      },
      mimeType,
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

export async function saveBlobViaTauri(blob: Blob, dirPath: string, fileName = 'export.png'): Promise<FileLocation> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  await writeFile(join(dirPath, fileName), buf, {});
  setLastSettingsStore('exportedDirPaths', (prev) => {
    if (prev.includes(dirPath)) {
      prev = [...prev.filter((p) => p !== dirPath), dirPath];
      return prev;
    }
    if (prev.length >= 10) prev.shift();
    return [...prev, dirPath];
  });

  return {
    path: dirPath,
    name: fileName,
  };
}
