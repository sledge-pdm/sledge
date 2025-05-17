import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { canvasStore } from '~/stores/ProjectStores';
import { Size2D } from '~/types/Size';
import { Consts } from '~/utils/consts';
import LayerImageAgent from '../layer/image/LayerImageAgent';

export function calcThumbnailSize(origW: number, origH: number): Size2D {
  return calcFitSize(origW, origH, Consts.projectThumbnailSize, Consts.projectThumbnailSize);
}

function calcFitSize(origW: number, origH: number, maxW: number, maxH: number): Size2D {
  // 枠内に収まる最大の拡大縮小率
  const scale = Math.min(maxW / origW, maxH / origH);
  return { width: Math.round(origW * scale), height: Math.round(origH * scale) };
}

export class ThumbnailGenerator {
  private off!: OffscreenCanvas;
  private tmp!: OffscreenCanvas;
  constructor() {
    // 初期化時に一度だけ
    this.off = new OffscreenCanvas(1, 1);
    this.tmp = new OffscreenCanvas(1, 1);
  }

  generateLayerThumbnail(agent: LayerImageAgent, width: number, height: number): ImageData {
    const w = agent.getWidth();
    const h = agent.getHeight();
    this.off.width = width;
    this.off.height = height;
    this.tmp.width = w;
    this.tmp.height = h;
    const ctx = this.off.getContext('2d', { willReadFrequently: true })!;

    const tctx = this.tmp.getContext('2d', { willReadFrequently: true })!;

    const imgData = new ImageData(agent.getBuffer(), w, h);
    tctx?.putImageData(imgData, 0, 0);
    ctx?.drawImage(this.tmp, 0, 0, w, h, 0, 0, width, height);

    const imageData = ctx?.getImageData(0, 0, width, height);

    return imageData;
  }

  generateCanvasThumbnail(width: number, height: number): ImageData {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    this.off.width = width;
    this.off.height = height;
    const ctx = this.off.getContext('2d', { willReadFrequently: true })!;
    ctx?.drawImage(webGLRenderer?.getCanvasElement()!, 0, 0, w, h, 0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    const imageData = ctx?.getImageData(0, 0, width, height);
    return imageData;
  }

  generateCanvasThumbnailBlob(width: number, height: number): Promise<Blob> {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    this.off.width = width;
    this.off.height = height;
    const ctx = this.off.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    ctx?.drawImage(webGLRenderer?.getCanvasElement()!, 0, 0, w, h, 0, 0, width, height);
    const imageData = ctx?.getImageData(0, 0, width, height);
    return this.off.convertToBlob();
  }
}
