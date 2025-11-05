import { PackedDiffs } from 'node_modules/@sledge/anvil/src/types/patch/Patch';
import { ImagePoolEntry } from '~/features/image_pool';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { setImagePoolStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { BaseHistoryAction, BaseHistoryActionProps, SerializedHistoryAction } from '../base';

/**
 * History action for Converting selection into image.
 * If convertion done with delete, undoing this will revert "add image" and "delete selection" by removing image and restore selection.
 * Otherwise (convert/cut), this will works as same as ImagePoolHistory(add).
 */
export interface ConvertSelectionHistoryActionProps extends BaseHistoryActionProps {
  layerId: string;
  // pass undefined if nothing has deleted (copy)
  patch?: PackedDiffs;
  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
}

export class ConvertSelectionHistoryAction extends BaseHistoryAction {
  readonly type = 'convert_selection';

  layerId: string;

  oldEntries: ImagePoolEntry[];
  newEntries: ImagePoolEntry[];
  patch?: PackedDiffs;

  constructor(public readonly props: ConvertSelectionHistoryActionProps) {
    super(props);

    this.layerId = props.layerId;
    this.oldEntries = props.oldEntries;
    this.newEntries = props.newEntries;
    this.patch = props.patch;
  }

  undo(): void {
    setImagePoolStore('entries', [...this.oldEntries]);

    if (this.patch) {
      if (floatingMoveManager.isMoving()) {
        cancelMove();
        return;
      }
      getAnvilOf(this.layerId)?.applyPatch(this.patch, 'undo');
    }

    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${this.layerId}) undo` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
  }

  redo(): void {
    setImagePoolStore('entries', [...this.newEntries]);

    if (this.patch) {
      if (floatingMoveManager.isMoving()) {
        cancelMove();
        return;
      }
      getAnvilOf(this.layerId)?.applyPatch(this.patch, 'redo');
    }

    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Anvil(${this.layerId}) redo` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
  }

  serialize(): SerializedHistoryAction {
    return {
      type: this.type,
      props: {
        context: this.context,
        label: this.label,
        layerId: this.layerId,
        patch: this.patch,
        oldEntries: this.props.oldEntries,
        newEntries: this.props.newEntries,
      } as ConvertSelectionHistoryActionProps,
    };
  }
}
