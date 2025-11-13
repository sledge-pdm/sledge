import { AntialiasMode, RgbaBuffer } from '@sledge/anvil';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';

export class LayerThumbnailGenerator {
  private thumbnailBuffer: RgbaBuffer;
  private thumbnailWidth = 1;
  private thumbnailHeight = 1;

  constructor() {
    this.thumbnailBuffer = new RgbaBuffer(1, 1);
  }

  generateLayerThumbnail(layerId: string, width: number, height: number): ImageData {
    try {
      const anvil = getAnvilOf(layerId);
      if (!anvil) throw new Error('No Anvil for layer ' + layerId);
      const sourceWidth = anvil.getWidth();
      const sourceHeight = anvil.getHeight();
      if (sourceWidth === 0 || sourceHeight === 0 || width === 0 || height === 0) {
        return new ImageData(Math.max(width, 1), Math.max(height, 1));
      }
      const scaleX = width / sourceWidth;
      const scaleY = height / sourceHeight;
      const antialiasMode = AntialiasMode.Nearest;
      const bufferHandle = anvil.getBufferHandle();
      const target = this.ensureThumbnailBuffer(width, height);
      this.clearThumbnailBuffer(target);
      // Currently ignore floating buffer due to performance cost
      // const isFloating = layerId === layerListStore.activeLayerId && floatingMoveManager.isMoving();
      // if (isFloating) {
      //   const floatingSource = floatingMoveManager.getCompositePreview() ?? floatingMoveManager.getPreviewBuffer();
      //   if (floatingSource) {
      //     target.transferFromRaw(floatingSource, sourceWidth, sourceHeight, { scaleX, scaleY, antialiasMode });
      //     return new ImageData(new Uint8ClampedArray(target.data), width, height);
      //   }
      // }
      target.transferFromBuffer(bufferHandle, { scaleX, scaleY, antialiasMode });
      return new ImageData(new Uint8ClampedArray(target.data), width, height);
    } catch (err) {
      // Suppress thumbnail generation errors; return a transparent fallback ImageData
      // (avoid escalating as a critical error for thumbnail generation)
      // eslint-disable-next-line no-console
      console.warn('LayerThumbnailGenerator.generateLayerThumbnail suppressed error:', err);
      return new ImageData(width || 1, height || 1);
    }
  }

  private ensureThumbnailBuffer(width: number, height: number): RgbaBuffer {
    if (this.thumbnailWidth !== width || this.thumbnailHeight !== height) {
      this.thumbnailBuffer = new RgbaBuffer(width, height);
      this.thumbnailWidth = width;
      this.thumbnailHeight = height;
    }
    return this.thumbnailBuffer;
  }

  private clearThumbnailBuffer(buffer: RgbaBuffer): void {
    buffer.data.fill(0);
  }
}
