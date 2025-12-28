import { convertCanvasToBlob, convertLayerToBlob, Exporter } from '~/features/io/export/exporter/Exporter';
import { Layer } from '~/features/layer';

export class PNGExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertCanvasToBlob('png', 100, scale);
    if (!blob) throw new Error('Failed to export PNG: blob is undefined');
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertLayerToBlob(layer, 'png', 100, scale);
    if (!blob) throw new Error('Failed to export PNG: blob is undefined');
    return blob;
  }
}
