import { Size2D } from '@sledge/core';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Consts } from '~/Consts';
import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { canvasStore, layerListStore } from '~/stores/ProjectStores';

export function calcThumbnailSize(origW: number, origH: number): Size2D {
  return calcFitSize(origW, origH, Consts.projectThumbnailSize, Consts.projectThumbnailSize);
}

function calcFitSize(origW: number, origH: number, maxW: number, maxH: number): Size2D {
  const scale = Math.min(maxW / origW, maxH / origH);
  return { width: Math.round(origW * scale), height: Math.round(origH * scale) };
}

export class ThumbnailGenerator {
  private off: OffscreenCanvas;
  private tmp: OffscreenCanvas;
  private offCtx: OffscreenCanvasRenderingContext2D;
  private tmpCtx: OffscreenCanvasRenderingContext2D;

  // Cache for avoiding unnecessary resizing
  private lastOffWidth = 0;
  private lastOffHeight = 0;
  private lastTmpWidth = 0;
  private lastTmpHeight = 0;

  constructor() {
    this.off = new OffscreenCanvas(1, 1);
    this.tmp = new OffscreenCanvas(1, 1);
    this.offCtx = this.off.getContext('2d', { willReadFrequently: true })!;
    this.tmpCtx = this.tmp.getContext('2d', { willReadFrequently: true })!;
  }

  generateLayerThumbnail(agent: LayerImageAgent, width: number, height: number): ImageData {
    try {
      const w = agent.getWidth();
      const h = agent.getHeight();

      // Only resize canvases if dimensions actually changed
      if (this.lastOffWidth !== width || this.lastOffHeight !== height) {
        this.off.width = width;
        this.off.height = height;
        this.lastOffWidth = width;
        this.lastOffHeight = height;
      }

      if (this.lastTmpWidth !== w || this.lastTmpHeight !== h) {
        this.tmp.width = w;
        this.tmp.height = h;
        this.lastTmpWidth = w;
        this.lastTmpHeight = h;
      }

      // Clear contexts efficiently (resizing already clears, so only clear if no resize)
      if (this.lastOffWidth === width && this.lastOffHeight === height) {
        this.offCtx.clearRect(0, 0, width, height);
      }

      const buf =
        agent.layerId === layerListStore.activeLayerId && floatingMoveManager.isMoving()
          ? floatingMoveManager.getPreviewBuffer()!
          : agent.getBuffer();
      // Keep slice() for now to avoid type issues, but optimize canvas resizing
      const imgData = new ImageData(buf.slice(), w, h);
      this.tmpCtx.putImageData(imgData, 0, 0);

      this.offCtx.imageSmoothingEnabled = false;
      this.offCtx.drawImage(this.tmp, 0, 0, w, h, 0, 0, width, height);

      return this.offCtx.getImageData(0, 0, width, height);
    } catch (err) {
      // Suppress thumbnail generation errors; return a transparent fallback ImageData
      // (avoid escalating as a critical error for thumbnail generation)
      // eslint-disable-next-line no-console
      console.warn('ThumbnailGenerator.generateLayerThumbnail suppressed error:', err);
      try {
        return new ImageData(width || 1, height || 1);
      } catch {
        // In very constrained environments ImageData constructor may fail; create minimal 1x1
        return new ImageData(1, 1);
      }
    }
  }

  generateCanvasThumbnail(width: number, height: number): ImageData | undefined {
    try {
      const srcW = canvasStore.canvas.width;
      const srcH = canvasStore.canvas.height;
      this.off.width = width;
      this.off.height = height;
      this.tmp.width = srcW;
      this.tmp.height = srcH;

      const ctx = this.off.getContext('2d', { willReadFrequently: true })!;
      const tctx = this.tmp.getContext('2d', { willReadFrequently: true })!;

      const buffer = webGLRenderer!.readPixelsFlipped();
      const imgData = new ImageData(buffer.slice(), srcW, srcH);
      tctx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.tmp, 0, 0, srcW, srcH, 0, 0, width, height);

      return ctx.getImageData(0, 0, width, height);
    } catch (err) {
      // Suppress errors during canvas thumbnail generation and return undefined
      // eslint-disable-next-line no-console
      console.warn('ThumbnailGenerator.generateCanvasThumbnail suppressed error:', err);
      return undefined;
    }
  }

  generateCanvasThumbnailBlob(width: number, height: number): Promise<Blob> {
    try {
      const srcW = canvasStore.canvas.width;
      const srcH = canvasStore.canvas.height;
      this.off.width = width;
      this.off.height = height;
      this.tmp.width = srcW;
      this.tmp.height = srcH;

      const ctx = this.off.getContext('2d', { willReadFrequently: true })!;
      const tctx = this.tmp.getContext('2d', { willReadFrequently: true })!;

      const buffer = webGLRenderer!.readPixelsFlipped();
      const imgData = new ImageData(buffer.slice(), srcW, srcH);
      tctx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.tmp, 0, 0, srcW, srcH, 0, 0, width, height);

      return this.off.convertToBlob();
    } catch (err) {
      // Suppress blob generation errors and return an empty blob as fallback
      // eslint-disable-next-line no-console
      console.warn('ThumbnailGenerator.generateCanvasThumbnailBlob suppressed error:', err);
      return Promise.resolve(new Blob());
    }
  }
}
