import { PixelDiff } from '~/models/history/HistoryManager';
import { Point } from '~/models/types/Point';
import { Size2D } from '~/models/types/Size';
import { Vec2 } from '~/models/types/Vector';
import { RGBAColor } from '~/utils/ColorUtils';

export default class PixelBufferManager {
  constructor(
    public buffer: Uint8ClampedArray,
    public width: number,
    public height: number
  ) {}

  public getPixel(position: Vec2): RGBAColor {
    const i = (position.y * this.width + position.x) * 4;
    return [this.buffer[i] ?? 0, this.buffer[i + 1] ?? 0, this.buffer[i + 2] ?? 0, this.buffer[i + 3] ?? 0];
  }

  public setRawPixel(position: Vec2, color: RGBAColor): PixelDiff | undefined {
    if (!this.isInBounds(position)) return undefined;
    const idx = position.y * this.width + position.x;
    const ptr = idx * 4;
    const before: RGBAColor = [this.buffer[ptr], this.buffer[ptr + 1], this.buffer[ptr + 2], this.buffer[ptr + 3]];

    this.buffer[ptr] = color[0];
    this.buffer[ptr + 1] = color[1];
    this.buffer[ptr + 2] = color[2];
    this.buffer[ptr + 3] = color[3];

    return { kind: 'pixel', position, before, after: color };
  }

  public changeSize(
    newSize: Size2D,
    destOrigin: Point = { x: 0, y: 0 }, // 新バッファ上の貼り付け開始位置
    srcOrigin: Point = { x: 0, y: 0 } // 元バッファ上の切り取り開始位置
  ): void {
    const { width: newW, height: newH } = newSize;
    const oldW = this.width,
      oldH = this.height;
    const oldBuf = this.buffer;
    const newBuf = new Uint8ClampedArray(newW * newH * 4);

    // 元バッファから実際にコピーできる幅／高さ
    const copyW = Math.min(oldW - srcOrigin.x, newW - destOrigin.x);
    const copyH = Math.min(oldH - srcOrigin.y, newH - destOrigin.y);

    for (let y = 0; y < copyH; y++) {
      // 元バッファの読み出し開始オフセット
      const oldRow = (y + srcOrigin.y) * oldW + srcOrigin.x;
      const oldOffset = oldRow * 4;
      // 新バッファの書き込み開始オフセット
      const newRow = (y + destOrigin.y) * newW + destOrigin.x;
      const newOffset = newRow * 4;
      // 一行分コピー
      newBuf.set(oldBuf.subarray(oldOffset, oldOffset + copyW * 4), newOffset);
    }

    this.buffer = newBuf;
    this.width = newW;
    this.height = newH;
  }

  public isInBounds(position: Vec2) {
    return position.x >= 0 && position.y >= 0 && position.x < this.width && position.y < this.height;
  }
}
