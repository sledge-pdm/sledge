import { rawToWebp } from '@sledge/anvil';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Exporter, getScaledBuffer } from '~/features/io/image/out/exporter/Exporter';
import { Layer } from '~/features/layer';
import { getBufferCopy } from '~/features/layer/anvil/AnvilController';

export class LosslessWebPExporter extends Exporter {
  async canvasToBlob(quality: number = 0.92, scale: number = 1): Promise<Blob> {
    if (!webGLRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer = webGLRenderer.readPixelsFlipped();
    const scaledBuffer = getScaledBuffer(buffer, scale);
    const webpBuffer = rawToWebp(new Uint8Array(scaledBuffer.data.buffer), scaledBuffer.width, scaledBuffer.height);
    const blob = new Blob([new Uint8ClampedArray(webpBuffer)], { type: 'image/webp' });
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    if (!webGLRenderer) throw new Error('Export Error: Renderer not defined');
    const buffer = getBufferCopy(layer.id);
    if (!buffer) throw new Error(`Export Error: Cannot export layer ${layer.name}.`);
    const scaledBuffer = getScaledBuffer(buffer, scale);
    const webpBuffer = rawToWebp(new Uint8Array(scaledBuffer.data), scaledBuffer.width, scaledBuffer.height);
    const blob = new Blob([new Uint8ClampedArray(webpBuffer)], { type: 'image/webp' });
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }
}
