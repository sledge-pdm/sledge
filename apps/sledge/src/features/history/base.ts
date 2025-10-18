// Feature: history - base action types and abstract class
export type HistoryActionTypes =
  | 'canvas_size'
  | 'color'
  | 'image_pool'
  | 'image_pool_entry_props'
  | 'layer_buffer'
  | 'layer_list'
  | 'layer_merge'
  | 'layer_props'
  | 'unknown';

export abstract class BaseHistoryAction {
  abstract readonly type: HistoryActionTypes;
  constructor(
    public readonly context?: any,
    public readonly label?: string
  ) {}
  abstract undo(): void;
  abstract redo(): void;
}
