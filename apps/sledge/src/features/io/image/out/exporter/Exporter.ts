import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { convertToMimetype } from '~/features/io/FileExtensions';
import { Layer } from '~/features/layer';
import { getBufferCopy } from '~/features/layer/anvil/AnvilController';
import { canvasStore } from '~/stores/ProjectStores';

export abstract class Exporter {
  abstract canvasToBlob(quality?: number, scale?: number): Promise<Blob>;
  abstract layerToBlob(layer: Layer, quality?: number, scale?: number): Promise<Blob>;
}

export async function convertCanvasToBlob(format: 'png' | 'jpeg' | 'webp_lossy', quality: number = 0.92, scale: number = 1): Promise<Blob> {
  if (webGLRenderer === undefined) throw new Error('Export Error: Renderer not defined');

  const buffer = webGLRenderer.readPixelsFlipped();
  const offscreen = getScaledCanvas(buffer, scale);
  const mimeType = convertToMimetype(format);

  if (!mimeType) {
    throw new Error('Export Error: Mime Type not found.');
  }
  return new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export Error: toBlob returned null'));
      },
      mimeType,
      quality
    );
  });
}

export async function convertLayerToBlob(
  layer: Layer,
  format: 'png' | 'jpeg' | 'webp_lossy',
  quality: number = 0.92,
  scale: number = 1
): Promise<Blob> {
  if (webGLRenderer === undefined) throw new Error('Export Error: Renderer not defined');

  const buffer = getBufferCopy(layer.id);
  if (!buffer) throw new Error(`Export Error: Cannot export layer ${layer.name}.`);

  const offscreen = getScaledCanvas(buffer, scale);
  const mimeType = convertToMimetype(format);

  if (!mimeType) {
    throw new Error('Export Error: Mime Type not found.');
  }
  return new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export Error: toBlob returned null'));
      },
      mimeType,
      quality
    );
  });
}

export function getScaledCanvas(buffer: Uint8ClampedArray, scale: number = 1) {
  const { width, height } = canvasStore.canvas;

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

  return target;
}

export function getScaledBuffer(buffer: Uint8ClampedArray, scale: number = 1): ImageData {
  const { width, height } = canvasStore.canvas;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx2d = offscreen.getContext('2d')!;
  const imgData = new ImageData(buffer.slice(), width, height);
  ctx2d.putImageData(imgData, 0, 0);

  let target = offscreen;
  const scaled = document.createElement('canvas');

  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  scaled.width = scaledWidth;
  scaled.height = scaledHeight;
  const ctxScaled = scaled.getContext('2d')!;
  ctxScaled.imageSmoothingEnabled = false;
  ctxScaled.drawImage(offscreen, 0, 0, scaled.width, scaled.height);
  target = scaled;

  const imageData = target.getContext('2d')!.getImageData(0, 0, scaledWidth, scaledHeight);

  return imageData;
}
