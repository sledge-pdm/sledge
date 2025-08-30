import { Vec2 } from '@sledge/core';
import { Diff, DiffAction, getDiffHash, PixelDiff } from '~/controllers/history/actions/LayerBufferHistoryAction';

export default class DiffManager {
  private currentDiffAction: DiffAction;

  // Buffer for batched pixel diffs
  private pixelBatch: Map<number, PixelDiff> = new Map();
  private batchSize = 100; // batch size

  constructor() {
    this.currentDiffAction = { diffs: new Map() };
  }

  public getCurrent() {
    return this.currentDiffAction;
  }

  public reset() {
    // Flush remaining batch before resetting
    this.flushPixelBatch();
    this.currentDiffAction = { diffs: new Map() };
  }

  public add(diffs: Diff[] | Diff) {
    if (Array.isArray(diffs)) {
      diffs.forEach((d) => this.addSingle(d));
    } else {
      this.addSingle(diffs);
    }
  }

  private addSingle(diff: Diff) {
    if (diff.kind === 'pixel') {
      // Pixel diffs are batched
      this.addToPixelBatch(diff);
    } else {
      // Tile/whole diffs are applied immediately
      this.set(diff);
    }
  }

  private addToPixelBatch(diff: PixelDiff) {
    const hash = getDiffHash(diff) as number;
    this.pixelBatch.set(hash, diff);

    // Flush when the batch reaches threshold
    if (this.pixelBatch.size >= this.batchSize) {
      this.flushPixelBatch();
    }
  }

  private flushPixelBatch() {
    if (this.pixelBatch.size === 0) return;

    // Apply the batch to the current action
    for (const [hash, diff] of this.pixelBatch) {
      this.currentDiffAction.diffs.set(hash, diff);
    }

    this.pixelBatch.clear();
  }

  public set(diff: Diff) {
    this.currentDiffAction.diffs.set(getDiffHash(diff), diff);
  }

  public isDiffExists(position: Vec2) {
    const hash = position.x * 100000 + position.y;
    return this.currentDiffAction.diffs.has(hash) || this.pixelBatch.has(hash);
  }

  // Force flush batch (e.g., at the end of a draw)
  public flush() {
    this.flushPixelBatch();
  }
}
