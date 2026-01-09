import { toUint8ClampedArray } from '@sledge-pdm/core';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Exporter, getScaledBuffer } from '~/features/io/export/exporter/Exporter';
import { Layer } from '~/features/layer';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { rawToWebp } from '~/utils/wasm';

export class LosslessWebPExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    if (!webGLRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(webGLRenderer.readPixelsFlipped());
    const scaledBuffer = getScaledBuffer(buffer, scale);
    const webpBuffer = rawToWebp(scaledBuffer.data, scaledBuffer.width, scaledBuffer.height);
    const blob = new Blob([new Uint8ClampedArray(webpBuffer)], { type: 'image/webp' });
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    if (!webGLRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer = toUint8ClampedArray(getLayer(layer.id).exportRaw()) as Uint8ClampedArray<ArrayBuffer>;
    const scaledBuffer = getScaledBuffer(buffer, scale);
    const webpBuffer = rawToWebp(scaledBuffer.data, scaledBuffer.width, scaledBuffer.height);
    const blob = new Blob([new Uint8ClampedArray(webpBuffer)], { type: 'image/webp' });
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }
}
