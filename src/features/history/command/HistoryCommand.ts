// HistoryCommand is an atomic action that can be executed forward and backward.

import { HistoryContext } from '~/features/history/types';

type HistoryCommandTypes =
  | 'canvas_size'
  | 'color'
  | 'convert_selection'
  | 'frasco_layer'
  | 'image_pool'
  | 'layer_add'
  | 'layer_merge'
  | 'layer_props'
  | 'layer_remove'
  | 'layer_reorder'
  | 'set_active_layer';

export abstract class HistoryCommand {
  constructor(public readonly type: HistoryCommandTypes) {}

  abstract forward(): void;
  abstract backward(): void;
  abstract getContext(): HistoryContext;
}
