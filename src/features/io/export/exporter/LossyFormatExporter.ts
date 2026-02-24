import { Layer } from '@sledge-pdm/core';
import { convertCanvasToBlob, convertLayerToBlob, Exporter } from './Exporter';

type LossyFormat = 'png' | 'jpeg' | 'webp_lossy';

abstract class LossyFormatExporter extends Exporter {
  protected abstract readonly format: LossyFormat;
  protected abstract readonly label: string;

  protected resolveCanvasQuality(quality?: number): number | undefined {
    return quality;
  }

  protected resolveLayerQuality(quality?: number): number | undefined {
    return quality;
  }

  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertCanvasToBlob(this.format, this.resolveCanvasQuality(quality), scale);
    if (!blob) throw new Error(`Failed to export ${this.label}: blob is undefined`);
    return blob;
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    const blob = await convertLayerToBlob(layer, this.format, this.resolveLayerQuality(quality), scale);
    if (!blob) throw new Error(`Failed to export ${this.label}: blob is undefined`);
    return blob;
  }
}

export class PNGExporter extends LossyFormatExporter {
  protected readonly format = 'png' as const;
  protected readonly label = 'PNG';

  protected resolveCanvasQuality(): number {
    return 100;
  }

  protected resolveLayerQuality(): number {
    return 100;
  }
}

export class JPEGExporter extends LossyFormatExporter {
  protected readonly format = 'jpeg' as const;
  protected readonly label = 'JPEG';

  protected resolveLayerQuality(): number {
    return 100;
  }
}

export class LossyWebPExporter extends LossyFormatExporter {
  protected readonly format = 'webp_lossy' as const;
  protected readonly label = 'WebP';

  protected resolveLayerQuality(): number {
    return 100;
  }
}
