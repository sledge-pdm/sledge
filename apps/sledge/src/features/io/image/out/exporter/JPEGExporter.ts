import { convertCanvasToBlob, convertLayerToBlob, Exporter } from '~/features/io/image/out/exporter/Exporter';
import { Layer } from '~/features/layer';

export class JPEGExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertCanvasToBlob('jpeg', quality, scale);
    if (!blob) throw new Error('Failed to export PNG: blob is undefined');
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertLayerToBlob(layer, 'jpeg', 100, scale);
    if (!blob) throw new Error('Failed to export JPEF: blob is undefined');
    return blob;
  }
}
