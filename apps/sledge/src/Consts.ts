export const Consts = {
  maxPenSize: 100,
  minCanvasWidth: 1,
  maxCanvasWidth: 10000, // may limited even smaller by webgl's max texture size
  minCanvasHeight: 1,
  maxCanvasHeight: 10000, // may limited even smaller by webgl's max texture size

  webGLTextureSizeLimitMargin: 100,

  zoomPrecisionSignificantDigits: 4,
  zoomByReferencePrecisionSignificantDigits: 2,

  rotationPrecisionSignificantDigits: 1,

  maxLayerSize: 64,

  projectThumbnailSize: 500,

  globalConfigFileName: 'global.json',
  toolPresetsConfigFileName: 'tools.json',

  fileItemIndent: 8,

  webGLFullUploadThresholdPercent: 15,
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
