import { encode as encodeWebp } from '@jsquash/webp';
import { Layer } from '@sledge-pdm/core';
import { Exporter, getScaledBuffer } from '~/features/io/export/exporter/Exporter';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { frascoRenderer } from '~/webgl/FrascoRenderer';

export class LosslessWebPExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    if (!frascoRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(frascoRenderer.readPixelsFlipped());
    const scaledBuffer = getScaledBuffer(buffer, scale);
    const webpBuffer = await encodeWebp(scaledBuffer, { lossless: 1 });
    const blob = new Blob([new Uint8Array(webpBuffer)], { type: 'image/webp' });
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    if (!frascoRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer = new Uint8ClampedArray(getLayer(layer.id).readPixels());
    const scaledBuffer = getScaledBuffer(buffer, scale);
    const webpBuffer = await encodeWebp(scaledBuffer, { lossless: 1 });
    const blob = new Blob([new Uint8Array(webpBuffer)], { type: 'image/webp' });
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }
}
