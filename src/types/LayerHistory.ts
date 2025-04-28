import { DiffAction } from '../models/layer_image/HistoryManager';

export type LayerHistory = {
  undoStack: DiffAction[];
  redoStack: DiffAction[];
};
