import { Size2D } from '@sledge-pdm/core';

export type CanvasStore = {
  size: Size2D;
};

export const defaultCanvasStore: CanvasStore = {
  size: {
    width: 1024,
    height: 1024,
  },
};
