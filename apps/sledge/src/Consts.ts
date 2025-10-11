export const Consts = {
  maxPenSize: 100,
  minCanvasWidth: 1,
  minCanvasHeight: 1,
  maxCanvasWidth: 30000,
  maxCanvasHeight: 30000,

  webGLTextureSizeLimitMargin: 100,

  zoomPrecisionSignificantDigits: 4,
  zoomByReferencePrecisionSignificantDigits: 2,

  rotationPrecisionSignificantDigits: 0,

  maxLayerSize: 64,

  projectThumbnailSize: 500,

  globalConfigFileName: 'global.json',
  toolPresetsConfigFileName: 'tools.json',

  fileItemIndent: 8,

  webGLFullUploadThresholdPercent: 7,
};

export type KeyConfigCommands =
  | 'save'
  | 'undo'
  | 'redo'
  | 'pen'
  | 'eraser'
  | 'fill'
  | 'rect_select'
  | 'auto_select'
  | 'move'
  | 'pipette'
  | 'sizeIncrease'
  | 'sizeDecrease';
