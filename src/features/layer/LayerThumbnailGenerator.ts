import { LayerThumbnail } from '@sledge-pdm/frasco';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';

const THUMBNAIL_BASE_SIZE = 512;

const calcThumbnailScale = (width: number, height: number): number => {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const geometricMean = Math.sqrt(safeWidth * safeHeight);
  if (!Number.isFinite(geometricMean)) return 1;

  const ratio = geometricMean / THUMBNAIL_BASE_SIZE;
  const exponent = Math.max(0, Math.ceil(Math.log2(ratio)));
  return 2 ** exponent;
};

type LayerRef = NonNullable<ReturnType<typeof layerManager.getLayerOptional>>;

type CacheEntry = {
  layer: LayerRef;
  thumbnail: LayerThumbnail;
  scale: number;
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
    const size = layer.getSize();
    const scale = calcThumbnailScale(size.width, size.height);
    const existing = this.caches.get(layerId);
    if (existing && existing.layer === layer && existing.scale === scale) {
      return existing;
    }

    if (existing) {
      existing.thumbnail.dispose();
      this.caches.delete(layerId);
    }

    const thumbnail = new LayerThumbnail(layer, { scale });
    const entry = { layer, thumbnail, scale };
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
