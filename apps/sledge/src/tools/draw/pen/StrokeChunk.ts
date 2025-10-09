import { rgbaToPackedU32 } from '@sledge/anvil';
import { PixelPatchData } from 'node_modules/@sledge/anvil/src/types/patch/pixel';

export interface CompactPixelDiff {
  before: number; // packed RGBA32
  after: number; // packed RGBA32
}

export class StrokeChunk {
  // index = layer buffer index
  diffs: Map<number, CompactPixelDiff> = new Map();
  boundBox: { minX: number; minY: number; maxX: number; maxY: number } | undefined = undefined;

  add(layerWidth: number, unpacked: PixelPatchData | PixelPatchData[]) {
    if (Array.isArray(unpacked)) {
      for (const u of unpacked) {
        this.addSingle(layerWidth, u);
      }
    } else {
      this.addSingle(layerWidth, unpacked);
    }
  }

  private addSingle(layerWidth: number, unpacked: PixelPatchData) {
    const { x, y, before, after } = unpacked;

    const index = (y * layerWidth + x) * 4;
    const packed: CompactPixelDiff = {
      before: rgbaToPackedU32(before),
      after: rgbaToPackedU32(after),
    };
    // すでにある場合はそのbeforeを持ってくる
    const pastDiff = this.diffs.get(index);
    if (pastDiff) packed.before = pastDiff.before;

    this.diffs.set(index, packed);

    // bounding box 更新
    if (!this.boundBox) {
      this.boundBox = { minX: x, minY: y, maxX: x, maxY: y };
    } else {
      if (x < this.boundBox.minX) this.boundBox.minX = x;
      if (y < this.boundBox.minY) this.boundBox.minY = y;
      if (x > this.boundBox.maxX) this.boundBox.maxX = x;
      if (y > this.boundBox.maxY) this.boundBox.maxY = y;
    }
  }

  clear() {
    this.diffs.clear();
    this.boundBox = undefined;
  }
}
