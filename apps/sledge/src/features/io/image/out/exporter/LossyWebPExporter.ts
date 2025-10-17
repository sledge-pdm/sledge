import { convertCanvasToBlob, convertLayerToBlob, Exporter } from '~/features/io/image/out/exporter/Exporter';
import { Layer } from '~/features/layer';

export class LossyWebPExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertCanvasToBlob('webp_lossy', quality, scale);
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertLayerToBlob(layer, 'webp_lossy', 100, scale);
    if (!blob) throw new Error('Failed to export WebP: blob is undefined');
    return blob;
  }
}
