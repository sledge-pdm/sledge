import { Diff, DiffAction, getDiffHash } from '~/models/history/HistoryManager';
import { Vec2 } from '~/types/Vector';

export default class DiffManager {
  private currentDiffAction: DiffAction;

  constructor() {
    this.currentDiffAction = { diffs: new Map() };
  }

  public getCurrent() {
    return this.currentDiffAction;
  }

  public reset() {
    // 現状の記録をリセット(e.g. 操作終了時=履歴追加時)
    this.currentDiffAction = { diffs: new Map() };
  }

  public add(diffs: Diff[] | Diff) {
    if (Array.isArray(diffs)) {
      diffs.forEach((d) => this.set(d));
    } else {
      this.set(diffs);
    }
  }

  public set(diff: Diff) {
    this.currentDiffAction.diffs.set(getDiffHash(diff), diff);
  }

  public isDiffExists(position: Vec2) {
    return this.currentDiffAction.diffs.has(`${position.x},${position.y}`);
  }
}
