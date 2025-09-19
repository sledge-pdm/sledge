import type { Patch } from '@sledge/anvil';
import { applyPatch } from '~/features/layer/anvil/AnvilController';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { BaseHistoryAction } from '../base';

/**
 * History action for Anvil-based layer buffer changes.
 * Patch は packed RGBA32 を使用。undo/redo 双方向適用は AnvilController.applyPatch 経由。
 */
export class AnvilLayerHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_buffer'; // 既存と同一 type を維持し履歴表示互換

  constructor(
    public readonly layerId: string,
    public readonly patch: Patch,
    context?: any
  ) {
    super(context, `Layer ${layerId}: buffer`);
  }

  undo(): void {
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    applyPatch(this.layerId, this.patch, 'undo');
  }

  redo(): void {
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    applyPatch(this.layerId, this.patch, 'redo');
  }
}
