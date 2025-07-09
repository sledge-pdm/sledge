export const Consts = {
  maxPenSize: 20,
  minCanvasWidth: 1,
  maxCanvasWidth: 3000,
  minCanvasHeight: 1,
  maxCanvasHeight: 3000,

  maxLayerSize: 64,

  projectThumbnailSize: 500,

  globalConfigFileName: 'global.sledgeconfig',
};

export type KeyConfigCommands = 'undo' | 'redo' | 'pen' | 'eraser' | 'fill';
