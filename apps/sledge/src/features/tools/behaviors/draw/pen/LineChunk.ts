import { Anvil, PixelPatchData } from '@sledge/anvil';

/**
 * Tracks the temporary diffs created while showing Shift-line previews so they
 * can be reverted without cloning the whole layer buffer.
 */
export class LineChunk {
  private diffs: PixelPatchData[] = [];

  capture(diffs?: PixelPatchData[]) {
    if (!diffs?.length) return;
    this.diffs.push(...diffs);
  }

  hasPreview(): boolean {
    return this.diffs.length > 0;
  }

  restore(anvil: Anvil) {
    if (!this.diffs.length) return;
    const buffer = anvil.getBufferPointer();
    const width = anvil.getWidth();

    for (const diff of this.diffs) {
      const idx = (diff.x + diff.y * width) * 4;
      const [r, g, b, a] = diff.color;
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
      anvil.setDirty(diff.x, diff.y);
    }

    this.clear();
  }

  clear() {
    this.diffs = [];
  }
}
