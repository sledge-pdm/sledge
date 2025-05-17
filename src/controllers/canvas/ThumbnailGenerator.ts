import LayerImageAgent from '../layer/image/LayerImageAgent';

export class ThumbnailGenerator {
  private off!: OffscreenCanvas;
  private tmp!: OffscreenCanvas;
  constructor() {
    // 初期化時に一度だけ
    this.off = new OffscreenCanvas(1, 1);
    this.tmp = new OffscreenCanvas(1, 1);
  }

  generateThumbnail(agent: LayerImageAgent, previewW: number, previewH: number): ImageData {
    const w = agent.getWidth();
    const h = agent.getHeight();
    this.off.width = previewW;
    this.off.height = previewH;
    this.tmp.width = w;
    this.tmp.height = h;
    const ctx = this.off.getContext('2d')!;
    const tctx = this.tmp.getContext('2d')!;

    const imgData = new ImageData(agent.getBuffer(), w, h);
    tctx?.putImageData(imgData, 0, 0);
    ctx?.drawImage(this.tmp, 0, 0, w, h, 0, 0, previewW, previewH);

    const imageData = ctx?.getImageData(0, 0, previewW, previewH);

    return imageData;
  }
}
