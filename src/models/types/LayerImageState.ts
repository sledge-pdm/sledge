export type LayerImageState = {
  current: ImageData;
  DSLcurrent?: ImageData;
  undoStack: ImageData[];
  redoStack: ImageData[];
};
