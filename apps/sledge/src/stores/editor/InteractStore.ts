import { Size2D, Vec2 } from '@sledge/core';

export type InteractStore = {
  canvasAreaSize: Size2D;
  lastMouseWindow: Vec2;
  lastMouseOnCanvas: Vec2;
  isMouseOnCanvas: boolean;
  isInStroke: boolean;
  zoom: number;
  zoomByReference: number;
  zoomMin: number;
  zoomMax: number;
  touchZoomSensitivity: number;
  wheelZoomStep: number;
  offsetOrigin: Vec2;
  offset: Vec2;
  isDragging: boolean;
  rotation: number;
  verticalFlipped: boolean;
  horizontalFlipped: boolean;

  isCanvasSizeFrameMode: boolean;
  canvasSizeFrameOffset: Vec2;
  canvasSizeFrameSize: Size2D;
};

export const defaultInteractStore: InteractStore = {
  canvasAreaSize: { width: 0, height: 0 },
  lastMouseWindow: { x: 0, y: 0 },
  lastMouseOnCanvas: { x: 0, y: 0 },
  isMouseOnCanvas: false,
  isInStroke: false,
  zoom: 1,
  zoomByReference: 1,
  // zoomMin: 0.5,
  zoomMin: 1,
  // zoomMax: 8,
  zoomMax: 100,
  touchZoomSensitivity: 0.5,
  wheelZoomStep: 0.05,
  // オフセットの初期値
  offsetOrigin: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },

  rotation: 0,

  verticalFlipped: false,
  horizontalFlipped: false,

  isDragging: false,

  isCanvasSizeFrameMode: false,
  canvasSizeFrameOffset: { x: 0, y: 0 },
  canvasSizeFrameSize: { width: 0, height: 0 },
};
