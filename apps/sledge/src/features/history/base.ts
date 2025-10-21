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

export interface BaseHistoryActionProps {
  context?: any;
  label?: string;
}

export interface SerializedHistoryAction {
  type: HistoryActionTypes;
  props: BaseHistoryActionProps;
}

export abstract class BaseHistoryAction {
  abstract readonly type: HistoryActionTypes;
  context?: any;
  label?: string;

  constructor(public readonly props: BaseHistoryActionProps) {
    this.context = props.context;
    this.label = props.label;
  }
  abstract undo(): void;
  abstract redo(): void;

  abstract serialize(): SerializedHistoryAction;
}
