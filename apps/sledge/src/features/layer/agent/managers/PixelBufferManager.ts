import { Point, Size2D, Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';

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

  public setRawPixel(position: Vec2, color: RGBAColor): { before: RGBAColor; after: RGBAColor } | undefined {
    if (!this.isInBounds(position)) return undefined;
    const idx = position.y * this.width + position.x;
    const ptr = idx * 4;
    const before: RGBAColor = [this.buffer[ptr], this.buffer[ptr + 1], this.buffer[ptr + 2], this.buffer[ptr + 3]];

    this.buffer[ptr] = color[0];
    this.buffer[ptr + 1] = color[1];
    this.buffer[ptr + 2] = color[2];
    this.buffer[ptr + 3] = color[3];

    return { before, after: color };
  }

  public changeSize(
    newSize: Size2D,
    destOrigin: Point = { x: 0, y: 0 }, // paste origin on the new buffer
    srcOrigin: Point = { x: 0, y: 0 } // crop origin on the source buffer
  ): void {
    const { width: newW, height: newH } = newSize;
    const oldW = this.width,
      oldH = this.height;
    const oldBuf = this.buffer;
    const newBuf = new Uint8ClampedArray(newW * newH * 4);

    // 正常化: 負の destOrigin / srcOrigin はコピーを発生させないようにクランプ
    if (destOrigin.x < 0 || destOrigin.y < 0) {
      // 範囲外開始: 有効領域へずらす（対応する srcOrigin もシフト）
      const shiftX = destOrigin.x < 0 ? -destOrigin.x : 0;
      const shiftY = destOrigin.y < 0 ? -destOrigin.y : 0;
      destOrigin = { x: destOrigin.x + shiftX, y: destOrigin.y + shiftY };
      srcOrigin = { x: srcOrigin.x + shiftX, y: srcOrigin.y + shiftY };
    }
    if (srcOrigin.x < 0 || srcOrigin.y < 0) {
      const shiftX = srcOrigin.x < 0 ? -srcOrigin.x : 0;
      const shiftY = srcOrigin.y < 0 ? -srcOrigin.y : 0;
      srcOrigin = { x: srcOrigin.x + shiftX, y: srcOrigin.y + shiftY };
      destOrigin = { x: destOrigin.x + shiftX, y: destOrigin.y + shiftY };
    }

    // Width/height that can actually be copied from source buffer (>=0)
    let copyW = Math.min(oldW - srcOrigin.x, newW - destOrigin.x);
    let copyH = Math.min(oldH - srcOrigin.y, newH - destOrigin.y);
    if (copyW < 0) copyW = 0;
    if (copyH < 0) copyH = 0;

    for (let y = 0; y < copyH; y++) {
      // Read offset on the old buffer
      const oldRow = (y + srcOrigin.y) * oldW + srcOrigin.x;
      const oldOffset = oldRow * 4;
      // Write offset on the new buffer
      const newRow = (y + destOrigin.y) * newW + destOrigin.x;
      const newOffset = newRow * 4;
      // Copy one row
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
