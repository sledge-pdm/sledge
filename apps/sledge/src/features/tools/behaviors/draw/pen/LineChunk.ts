export interface CompactPixelDiff {
  color: number; // packed RGBA32
}

export class LineChunk {
  private boundary: { minX: number; minY: number; maxX: number; maxY: number } | undefined = undefined;

  private originalBuffer: Uint8ClampedArray | undefined = undefined;
  width: number = 0;
  height: number = 0;

  start(originalBuffer: Uint8ClampedArray, width: number, height: number) {
    this.originalBuffer = originalBuffer;
    this.width = width;
    this.height = height;
  }

  add(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return; // out of bounds

    if (!this.boundary) {
      // initialize bounding box
      this.boundary = { minX: x, minY: y, maxX: x, maxY: y };
    } else {
      // extend bounding box
      if (x < this.boundary.minX) this.boundary.minX = x;
      if (y < this.boundary.minY) this.boundary.minY = y;
      if (x > this.boundary.maxX) this.boundary.maxX = x;
      if (y > this.boundary.maxY) this.boundary.maxY = y;
    }
  }

  resetBoundary() {
    this.boundary = undefined;
  }

  getBoundingBox():
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | undefined {
    if (!this.boundary) return undefined;
    return {
      x: this.boundary.minX,
      y: this.boundary.minY,
      width: this.boundary.maxX - this.boundary.minX + 1,
      height: this.boundary.maxY - this.boundary.minY + 1,
    };
  }

  getPatch():
    | {
        bbox: { x: number; y: number; width: number; height: number };
        patch: Uint8ClampedArray;
      }
    | undefined {
    const bbox = this.getBoundingBox();
    if (!bbox || !this.originalBuffer) return undefined;
    const { x, y, width: w, height: h } = bbox;
    const patch = new Uint8ClampedArray(w * h * 4);

    for (let row = 0; row < h; row++) {
      const sy = y + row;
      if (sy < 0 || sy >= this.height) continue;
      const srcOffset = (sy * this.width + x) * 4;
      const dstOffset = row * w * 4;

      // Clamp horizontal copy within bounds
      let copyW = w;
      let srcXOffset = 0;
      if (x < 0) {
        const shift = -x;
        srcXOffset = shift * 4;
        copyW -= shift;
      }
      if (x + copyW > this.width) {
        copyW = this.width - x;
      }
      if (copyW <= 0) continue;

      patch.set(this.originalBuffer.subarray(srcOffset + srcXOffset, srcOffset + srcXOffset + copyW * 4), dstOffset + srcXOffset);
    }

    return { bbox, patch };
  }

  clear() {
    this.originalBuffer = undefined;
    this.boundary = undefined;
  }
}
