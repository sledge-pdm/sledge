export type LayerImage = {
  current: ImageData
  DSLcurrent?: ImageData
  undoStack: ImageData[]
  redoStack: ImageData[]
}
