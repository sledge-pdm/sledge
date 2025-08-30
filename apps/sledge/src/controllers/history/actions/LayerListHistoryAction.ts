import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';
import type { Layer } from '~/models/layer/Layer';

// history action for layer list changes (e.g. add, delete, reorder)
export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;

  constructor(
    public readonly kind: 'add' | 'delete' | 'reorder',
    // Common fields
    public readonly index: number,
    // For add/delete: full snapshot to restore/remove
    public readonly layerSnapshot?: Layer & { buffer?: Uint8ClampedArray },
    // For reorder: full before/after order to be robust across multiple moves
    public readonly beforeOrder?: string[],
    public readonly afterOrder?: string[],
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    // Pseudocode only (not wired):
    // switch (this.kind) {
    //   case 'add':
    //     // remove at index
    //     removeLayerAt(this.index)
    //     break;
    //   case 'delete':
    //     // insert snapshot at index
    //     insertLayerAt(this.index, this.layerSnapshot)
    //     // optionally restore buffer
    //     break;
    //   case 'reorder':
    //     setLayerOrder(this.beforeOrder)
    //     break;
    // }
  }

  redo(): void {
    // Pseudocode only (not wired):
    // switch (this.kind) {
    //   case 'add':
    //     insertLayerAt(this.index, this.layerSnapshot)
    //     break;
    //   case 'delete':
    //     removeLayerAt(this.index)
    //     break;
    //   case 'reorder':
    //     setLayerOrder(this.afterOrder)
    //     break;
    // }
  }
}
