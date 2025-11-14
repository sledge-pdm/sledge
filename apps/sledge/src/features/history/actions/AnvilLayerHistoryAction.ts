import { PackedDiffs } from '@sledge/anvil';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

/**
 * History action for Anvil-based layer buffer changes.
 */
export interface AnvilLayerHistoryActionProps extends BaseHistoryActionProps {
  layerId: string;
  patch: PackedDiffs;
}

export class AnvilLayerHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_buffer'; // 既存と同一 type を維持し履歴表示互換

  layerId: string;
  patch: PackedDiffs;

  constructor(public readonly props: AnvilLayerHistoryActionProps) {
    super(props);

    this.layerId = props.layerId;
    this.patch = props.patch;
  }

  undo(): void {
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    try {
      getAnvil(this.layerId).applyPatch(this.patch, 'undo');
    } catch {
      return;
    }

    updateWebGLCanvas(true, `Anvil(${this.layerId}) undo`);
    updateLayerPreview(this.layerId);
  }

  redo(): void {
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    try {
      getAnvil(this.layerId).applyPatch(this.patch, 'redo');
    } catch {
      return;
    }

    updateWebGLCanvas(true, `Anvil(${this.layerId}) redo`);
    updateLayerPreview(this.layerId);
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: this.props,
    };
  }
}
