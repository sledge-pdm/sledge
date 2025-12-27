/**
 * HistoryActionTester
 * 共通の「準備 → 適用 → undo → redo」シーケンスを簡潔に書くためのヘルパー。
 * action の生成関数だけ渡し、任意の前処理・適用処理・アサーションを差し込める。
 *
 * 使い方（例）:
 * const tester = new HistoryActionTester(() => new ColorHistoryAction(...));
 * tester.run({
 *   apply: (action) => action.redo(),
 *   assertAfterApply: () => expect(currentColor()).toStrictEqual(RED),
 *   assertAfterUndo: () => expect(currentColor()).toStrictEqual(BLACK),
 * });
 */

type HistoryActionLike = {
  undo(): void;
  redo(): void;
  registerBefore?(): void;
  registerAfter?(): void;
};

type RunOptions<TAction extends HistoryActionLike> = {
  /** registerBefore など事前処理があればここに */
  before?: (action: TAction) => void;
  /**
   * 状態を「適用後」にする処理。
   * キャンバスリサイズのように事前に registerBefore してからストアを書き換え、
   * registerAfter する場合はここにまとめる。必須。
   */
  apply: (action: TAction) => void;
  /** undo を差し替えたい場合（例: controller.undo を使う）に指定。未指定なら action.undo() */
  undo?: (action: TAction) => void;
  /** redo を差し替えたい場合（例: controller.redo を使う）に指定。未指定なら action.redo() */
  redo?: (action: TAction) => void;
  /** 適用直後のアサーション（apply 後、undo 前） */
  assertAfterApply?: (action: TAction) => void;
  /** undo 後のアサーション */
  assertAfterUndo?: (action: TAction) => void;
  /** redo 後のアサーション。指定が無ければ assertAfterApply を再利用。 */
  assertAfterRedo?: (action: TAction) => void;
};

export class HistoryActionTester<TAction extends HistoryActionLike> {
  constructor(private readonly buildAction: () => TAction) {}

  public run(options?: RunOptions<TAction>): TAction {
    const action = this.buildAction();

    options?.before?.(action);

    if (!options?.apply) {
      throw new Error('HistoryActionTester: apply is required to make state transitions explicit.');
    }
    options.apply(action);
    options?.assertAfterApply?.(action);

    if (options.undo) {
      options.undo(action);
    } else {
      action.undo();
    }
    options?.assertAfterUndo?.(action);

    if (options.redo) {
      options.redo(action);
    } else {
      action.redo();
    }
    (options?.assertAfterRedo ?? options?.assertAfterApply)?.(action);

    return action;
  }
}
