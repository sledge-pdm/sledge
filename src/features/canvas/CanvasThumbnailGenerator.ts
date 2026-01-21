import { FrascoThumbnail } from '@sledge-pdm/frasco';
import { frascoRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { logSystemWarn } from '~/features/log/service';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { calcThumbnailScale } from '~/utils/ThumbnailUtils';

type CacheEntry = {
  thumbnail: FrascoThumbnail;
  scale: number;
};

export class CanvasThumbnailGenerator {
  private off: OffscreenCanvas;
  private cache?: CacheEntry;
  private currentGL?: WebGL2RenderingContext;

  constructor() {
    this.off = new OffscreenCanvas(1, 1);
  }

  generateCanvasThumbnail(width: number, height: number): ImageData | undefined {
    try {
      const renderer = frascoRenderer;
      if (!renderer || width <= 0 || height <= 0) {
        return undefined;
      }

      const canvasSize = projectStore.canvas.size;
      const entry = this.ensureThumbnail(renderer.getGLContext(), canvasSize);
      if (!entry) return undefined;

      const layers = renderer.getCompositeLayers();
      const baseColor = renderer.getBaseColor();
      return entry.thumbnail.getImageData(layers, canvasSize, width, height, baseColor);
    } catch (err) {
      // Suppress errors during canvas thumbnail generation and return undefined
      logSystemWarn('CanvasThumbnailGenerator.generateCanvasThumbnail suppressed error.', {
        label: 'CanvasThumbnailGenerator',
        details: [err],
      });
      return undefined;
    }
  }

  generateCanvasThumbnailBlob(width: number, height: number): Promise<Blob> {
    try {
      const img = this.generateCanvasThumbnail(width, height);
      if (!img) return Promise.resolve(new Blob());

      this.off.width = img.width;
      this.off.height = img.height;
      const ctx = this.off.getContext('2d', { willReadFrequently: true })!;
      ctx.putImageData(img, 0, 0);
      return this.off.convertToBlob();
    } catch (err) {
      // Suppress blob generation errors and return an empty blob as fallback
      logSystemWarn('CanvasThumbnailGenerator.generateCanvasThumbnailBlob suppressed error.', {
        label: 'CanvasThumbnailGenerator',
        details: [err],
      });
      return Promise.resolve(new Blob());
    }
  }

  private ensureThumbnail(gl: WebGL2RenderingContext, canvasSize: { width: number; height: number }): CacheEntry | undefined {
    const scale = calcThumbnailScale(canvasSize.width, canvasSize.height);
    const cached = this.cache;
    if (cached && this.currentGL === gl && cached.scale === scale) {
      return cached;
    }
    if (cached) {
      cached.thumbnail.dispose();
      this.cache = undefined;
    }
    const thumbnail = new FrascoThumbnail(gl, { scale });
    const entry = { thumbnail, scale };
    this.cache = entry;
    this.currentGL = gl;
    return entry;
  }
}

export const canvasThumbnailGenerator = new CanvasThumbnailGenerator();
