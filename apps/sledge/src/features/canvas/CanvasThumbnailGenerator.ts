import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { canvasStore } from '~/stores/ProjectStores';
import { logSystemWarn } from '~/features/log/service';

export class CanvasThumbnailGenerator {
  private off: OffscreenCanvas;
  private tmp: OffscreenCanvas;

  constructor() {
    this.off = new OffscreenCanvas(1, 1);
    this.tmp = new OffscreenCanvas(1, 1);
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
      logSystemWarn('CanvasThumbnailGenerator.generateCanvasThumbnail suppressed error.', {
        label: 'CanvasThumbnailGenerator',
        details: [err],
      });
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
      logSystemWarn('CanvasThumbnailGenerator.generateCanvasThumbnailBlob suppressed error.', {
        label: 'CanvasThumbnailGenerator',
        details: [err],
      });
      return Promise.resolve(new Blob());
    }
  }
}

export const canvasThumbnailGenerator = new CanvasThumbnailGenerator();
