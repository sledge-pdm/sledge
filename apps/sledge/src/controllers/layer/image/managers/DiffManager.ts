import { Vec2 } from '@sledge/core';
import { Diff, DiffAction, getDiffHash, PixelDiff } from '~/controllers/history/actions/LayerBufferHistoryAction';

export default class DiffManager {
  private currentDiffAction: DiffAction;

  // バッチ処理用のバッファ
  private pixelBatch: Map<number, PixelDiff> = new Map();
  private batchSize = 100; // バッチサイズ

  constructor() {
    this.currentDiffAction = { diffs: new Map() };
  }

  public getCurrent() {
    return this.currentDiffAction;
  }

  public reset() {
    // 残っているバッチを処理してからリセット
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
      // ピクセルdiffはバッチ処理
      this.addToPixelBatch(diff);
    } else {
      // タイルやwholeは従来通り即座に処理
      this.set(diff);
    }
  }

  private addToPixelBatch(diff: PixelDiff) {
    const hash = getDiffHash(diff) as number;
    this.pixelBatch.set(hash, diff);

    // バッチサイズに達したら処理
    if (this.pixelBatch.size >= this.batchSize) {
      this.flushPixelBatch();
    }
  }

  private flushPixelBatch() {
    if (this.pixelBatch.size === 0) return;

    // バッチを一括処理
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

  // 強制的にバッチを処理（描画完了時などに呼び出し）
  public flush() {
    this.flushPixelBatch();
  }
}
