// HistoryCommand is an atomic action that can be executed forward and backward.

type HistoryCommandTypes = 'set_active_layer' | 'layer_add' | 'layer_props' | 'layer_remove' | 'layer_reorder';

export interface CommandContext {}

export abstract class HistoryCommand {
  constructor(public readonly type: HistoryCommandTypes) {}

  abstract forward(): void;
  abstract backward(): void;
  abstract getContext(): CommandContext;
}
