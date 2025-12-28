import { PackedDiffs } from '@sledge/anvil';
import { ImagePoolEntry } from '~/features/image_pool';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { setImagePoolStore } from '~/stores/ProjectStores';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
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
      getAnvil(this.layerId).applyPatch(this.patch, 'undo');
    }

    updateWebGLCanvas(true, `Anvil(${this.layerId}) undo`);
    updateLayerPreview(this.layerId);
  }

  redo(): void {
    setImagePoolStore('entries', [...this.newEntries]);

    if (this.patch) {
      if (floatingMoveManager.isMoving()) {
        cancelMove();
        return;
      }
      getAnvil(this.layerId).applyPatch(this.patch, 'redo');
    }

    updateWebGLCanvas(true, `Anvil(${this.layerId}) redo`);
    updateLayerPreview(this.layerId);
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
