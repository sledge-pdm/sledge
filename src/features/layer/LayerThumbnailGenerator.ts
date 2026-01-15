import { LayerThumbnail } from '@sledge-pdm/frasco';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';

const THUMBNAIL_SCALE = 8;

type LayerRef = NonNullable<ReturnType<typeof layerManager.getLayerOptional>>;

type CacheEntry = {
  layer: LayerRef;
  thumbnail: LayerThumbnail;
};

export class LayerThumbnailGenerator {
  private caches: Map<string, CacheEntry> = new Map();

  generateLayerThumbnail(layerId: string, width: number, height: number): ImageData {
    try {
      const layer = layerManager.getLayerOptional(layerId);
      if (!layer || width <= 0 || height <= 0) {
        this.disposeCache(layerId);
        return new ImageData(Math.max(width, 1), Math.max(height, 1));
      }

      const entry = this.ensureThumbnail(layerId, layer);
      return entry.thumbnail.getImageData(width, height);
    } catch (err) {
      logSystemWarn('LayerThumbnailGenerator.generateLayerThumbnail suppressed error.', {
        label: 'LayerThumbnailGenerator',
        details: [err],
      });
      return new ImageData(Math.max(width, 1), Math.max(height, 1));
    }
  }

  private ensureThumbnail(layerId: string, layer: LayerRef): CacheEntry {
    const existing = this.caches.get(layerId);
    if (existing && existing.layer === layer) {
      return existing;
    }

    if (existing) {
      existing.thumbnail.dispose();
      this.caches.delete(layerId);
    }

    const thumbnail = new LayerThumbnail(layer, { scale: THUMBNAIL_SCALE });
    const entry = { layer, thumbnail };
    this.caches.set(layerId, entry);
    return entry;
  }

  private disposeCache(layerId: string): void {
    const entry = this.caches.get(layerId);
    if (!entry) return;
    entry.thumbnail.dispose();
    this.caches.delete(layerId);
  }
}

export const layerThumbnailGenerator = new LayerThumbnailGenerator();
