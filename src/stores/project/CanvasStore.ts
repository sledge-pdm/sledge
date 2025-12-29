import { Size2D } from '@sledge-pdm/core';

export type CanvasStore = {
  canvas: Size2D;
};

export const defaultCanvasStore: CanvasStore = {
  canvas: {
    width: 1024,
    height: 1024,
  },
};
