import { Consts as CoreConfig } from '@sledge/core';

export const Consts = {
  ...CoreConfig,

  maxPenSize: 20,
  minCanvasWidth: 1,
  maxCanvasWidth: 10000,
  minCanvasHeight: 1,
  maxCanvasHeight: 10000,

  maxLayerSize: 64,

  projectThumbnailSize: 500,

  globalConfigFileName: 'global.sledgeconfig',
};

export type KeyConfigCommands = 'save' | 'undo' | 'redo' | 'pen' | 'eraser' | 'fill' | 'sizeIncrease' | 'sizeDecrease' | 'pipette' | 'selection move';
