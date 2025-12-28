import { Anvil, type PixelPatchData } from '@sledge/anvil';

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
    anvil.restorePixelDiffs(this.diffs);

    this.clear();
  }

  clear() {
    this.diffs = [];
  }
}
