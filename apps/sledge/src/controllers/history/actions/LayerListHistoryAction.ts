import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';

// history action for layer list changes (e.g. add, delete, reorder)
export class LayerListHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_list' as const;

  constructor(
    public readonly kind: 'add' | 'delete' | 'reorder',
    context?: any
  ) {
    super(context);
  }

  undo(): void {
    // Implement undo logic
  }

  redo(): void {
    // Implement redo logic
  }
}
