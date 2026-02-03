// HistoryCommand is an atomic action that can be executed forward and backward.

import { HistoryContext } from '~/features/history/types';

export type HistoryCommandType =
  | 'canvas_size'
  | 'color'
  | 'selection_change'
  | 'convert_selection'
  | 'frasco_layer'
  | 'image_pool_add'
  | 'image_pool_remove'
  | 'image_pool_props'
  | 'layer_add'
  | 'layer_merge'
  | 'layer_props'
  | 'layer_remove'
  | 'layer_reorder'
  | 'set_active_layer';

export abstract class HistoryCommand {
  constructor(public readonly type: HistoryCommandType) {}

  abstract forward(): void;
  abstract backward(): void;
  abstract getContext(): HistoryContext;
  abstract serializeProps(): unknown;
}
