import { Size2D } from '~/types/Size';
import { Vec2 } from '~/types/Vector';

export default class SelectionMask {
  private mask: Uint8Array;

  constructor(
    private width: number,
    private height: number
  ) {
    // 「幅×高さ」で十分なので、4 倍不要
    this.mask = new Uint8Array(this.width * this.height);
  }

  public getWidth = () => this.width;
  public getHeight = () => this.height;

  public getMask() {
    return this.mask;
  }

  public setMask(mask: Uint8Array) {
    this.mask = mask;
  }

  public clear() {
    // すべて 0 に戻す
    this.mask = new Uint8Array(this.width * this.height);
  }

  public setFlag(pos: Vec2, flag: 0 | 1) {
    if (!this.isInBounds(pos)) return;
    const index = pos.y * this.width + pos.x;
    this.mask[index] = flag;
  }

  public get(pos: Vec2) {
    const index = pos.y * this.width + pos.x;
    return this.mask[index];
  }

  public changeSize(newSize: Size2D, destOrigin: Vec2 = { x: 0, y: 0 }, srcOrigin: Vec2 = { x: 0, y: 0 }): void {
    const { width: newW, height: newH } = newSize;
    const oldW = this.width,
      oldH = this.height;
    const oldBuf = this.mask;
    // 新マスクは「幅×高さ」で確保
    const newMask = new Uint8Array(newW * newH);

    // コピーできる範囲
    const copyW = Math.min(oldW - srcOrigin.x, newW - destOrigin.x);
    const copyH = Math.min(oldH - srcOrigin.y, newH - destOrigin.y);

    for (let y = 0; y < copyH; y++) {
      const oldRowOffset = (y + srcOrigin.y) * oldW + srcOrigin.x;
      const newRowOffset = (y + destOrigin.y) * newW + destOrigin.x;
      newMask.set(oldBuf.subarray(oldRowOffset, oldRowOffset + copyW), newRowOffset);
    }

    this.mask = newMask;
    this.width = newW;
    this.height = newH;
  }

  public isInBounds(position: Vec2) {
    return position.x >= 0 && position.y >= 0 && position.x < this.width && position.y < this.height;
  }
}
