import { DiffAction } from "../layer_image/HistoryManager";

export type LayerImage = {
  current: ImageData;
  undoStack: DiffAction[];
  redoStack: DiffAction[];
};
