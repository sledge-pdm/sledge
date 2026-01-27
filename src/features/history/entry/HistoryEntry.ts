// History entry that is accumulated in the undo/redo stack.
// HistoryEntry should be described as a wrapper around one command or a composition of multiple commands.

import { HistoryContext } from '~/features/history/types';

export type HistoryEntryTypes =
  | 'canvas_size'
  | 'color'
  | 'convert_selection'
  | 'image_pool'
  | 'layer_buffer'
  | 'layer_list'
  | 'layer_list_reorder'
  | 'layer_list_cut_paste'
  | 'layer_merge'
  | 'layer_props'
  | 'unknown';

export abstract class HistoryEntry {
  abstract undo(): void;
  abstract redo(): void;

  abstract getContext(): HistoryContext[];
}
