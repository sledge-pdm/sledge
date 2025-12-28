import { Size2D, Vec2 } from '@sledge/core';

export interface BoundBox {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export default class SelectionMask {
  private mask: Uint8Array;

  private colCnt: Uint32Array; // 列ごとの残ピクセル数
  private rowCnt: Uint32Array; // 行ごとの残ピクセル数

  private minX = Infinity;
  private maxX = -1;
  private minY = Infinity;
  private maxY = -1;

  constructor(
    private width: number,
    private height: number
  ) {
    // 「幅×高さ」で十分なので、4 倍不要
    this.mask = new Uint8Array(this.width * this.height);
    this.colCnt = new Uint32Array(width);
    this.rowCnt = new Uint32Array(height);
  }

  private allocateCounters() {
    this.colCnt = new Uint32Array(this.width);
    this.rowCnt = new Uint32Array(this.height);
  }

  public getWidth = () => this.width;
  public getHeight = () => this.height;

  public getMask() {
    return this.mask;
  }

  public setMask(mask: Uint8Array) {
    this.mask = mask;
    this.updateBoundingBox();
  }

  public selectAll() {
    this.mask.fill(1);
    this.colCnt.fill(this.height);
    this.rowCnt.fill(this.width);
    this.minX = 0;
    this.maxX = this.width - 1;
    this.minY = 0;
    this.maxY = this.height - 1;
  }

  public isCleared() {
    return this.minX === Infinity && this.maxX === -1 && this.minY === Infinity && this.maxY === -1;
  }

  public clear() {
    this.mask.fill(0);
    this.colCnt.fill(0);
    this.rowCnt.fill(0);
    this.minX = Infinity;
    this.maxX = -1;
    this.minY = Infinity;
    this.maxY = -1;
  }

  public getBoundBox(): BoundBox | undefined {
    if (this.maxX < this.minX || this.maxY < this.minY) return;
    return { left: this.minX, right: this.maxX, top: this.minY, bottom: this.maxY };
  }

  public setFlag(pos: Vec2, flag: 0 | 1) {
    if (!this.isInBounds(pos)) return;
    const index = pos.y * this.width + pos.x;
    this.set(index, flag);
  }

  public set(idx: number, flag: 0 | 1) {
    if (this.mask[idx] === flag) return; // 変化なし

    this.mask[idx] = flag;

    const x = idx % this.width;
    const y = Math.floor(idx / this.width);

    if (flag) {
      // 0→1
      this.mask[idx] = 1;
      if (++this.colCnt[x] === 1) {
        // 立ったのが初めて
        if (x < this.minX) this.minX = x;
        if (x > this.maxX) this.maxX = x;
      }
      if (++this.rowCnt[y] === 1) {
        if (y < this.minY) this.minY = y;
        if (y > this.maxY) this.maxY = y;
      }
    } else {
      // 1→0
      this.mask[idx] = 0;
      if (--this.colCnt[x] === 0) {
        // 列が空になった
        if (x === this.minX) while (this.minX < this.width && this.colCnt[this.minX] === 0) this.minX++;
        if (x === this.maxX) while (this.maxX >= 0 && this.colCnt[this.maxX] === 0) this.maxX--;
      }
      if (--this.rowCnt[y] === 0) {
        // 行が空になった
        if (y === this.minY) while (this.minY < this.height && this.rowCnt[this.minY] === 0) this.minY++;
        if (y === this.maxY) while (this.maxY >= 0 && this.rowCnt[this.maxY] === 0) this.maxY--;
      }
    }
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
    this.allocateCounters();

    this.updateBoundingBox();
  }

  public updateBoundingBox() {
    // ① カウンタをゼロクリア
    this.rowCnt.fill(0);
    this.colCnt.fill(0);

    // ② min/max を初期化
    this.minX = Infinity;
    this.maxX = -1;
    this.minY = Infinity;
    this.maxY = -1;

    // ③ 走査は “行優先” がメモリ連続で最速
    let idx = 0;
    for (let y = 0; y < this.height; y++) {
      let rowSum = 0;
      for (let x = 0; x < this.width; x++, idx++) {
        const v = this.mask[idx]; // ← 0 or 1
        rowSum += v; // 行カウント
        this.colCnt[x] += v; // 列カウント
      }
      this.rowCnt[y] = rowSum;
      if (rowSum) {
        // 行に１つでもあれば minY/maxY 更新
        if (y < this.minY) this.minY = y;
        this.maxY = y;
      }
    }

    // ④ minX/maxX は列カウンタを一度だけスキャン
    for (let x = 0; x < this.width; x++)
      if (this.colCnt[x]) {
        this.minX = x;
        break;
      }
    for (let x = this.width - 1; x >= 0; x--)
      if (this.colCnt[x]) {
        this.maxX = x;
        break;
      }
  }

  public isInBounds(position: Vec2) {
    return position.x >= 0 && position.y >= 0 && position.x < this.width && position.y < this.height;
  }
}
