import { PackedDiffs } from 'node_modules/@sledge/anvil/src/types/patch/Patch';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction } from '../base';

/**
 * History action for Anvil-based layer buffer changes.
 */
export class AnvilLayerHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_buffer'; // 既存と同一 type を維持し履歴表示互換

  constructor(
    public readonly layerId: string,
    public readonly patch: PackedDiffs,
    context?: any
  ) {
    super(context, `Layer ${layerId}: buffer`);
  }

  undo(): void {
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    getAnvilOf(this.layerId)?.applyPatch(this.patch, 'undo');

    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${this.layerId}) undo` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
  }

  redo(): void {
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    getAnvilOf(this.layerId)?.applyPatch(this.patch, 'redo');

    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${this.layerId}) redo` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
  }
}
