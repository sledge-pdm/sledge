import { Size2D, Vec2 } from '@sledge-pdm/core';

export type SelectionEditMode = 'add' | 'subtract' | 'replace' | 'move';
export type InteractStore = {
  lastPointerWindow: Vec2;
  lastPointerOnCanvas: Vec2;
  isPointerOnCanvas: boolean;
  isPointerOnStrokeDetectArea: boolean;

  strokeAreaCursor: string;

  // The "placement" position used in paste. should handled in less care.
  // (it's not a big deal if this position had reset/dropped. this will just fallback to (0, 0).)
  placementPosition: Vec2;

  initialZoom: number;

  zoom: number;

  zoomMinFromInitial: number;
  zoomMaxFromInitial: number;

  touchZoomSensitivity: number;
  wheelZoomStep: number;
  offsetOrigin: Vec2;
  offset: Vec2;
  isDragging: boolean;
  rotation: number;
  verticalFlipped: boolean;
  horizontalFlipped: boolean;

  selectionEditMode: SelectionEditMode;

  isCanvasSizeFrameMode: boolean;
  canvasSizeFrameOffset: Vec2;
  canvasSizeFrameSize: Size2D;
};

export const defaultInteractStore: InteractStore = {
  lastPointerWindow: { x: 0, y: 0 },
  lastPointerOnCanvas: { x: 0, y: 0 },
  isPointerOnCanvas: false,
  isPointerOnStrokeDetectArea: false,
  strokeAreaCursor: 'none',
  placementPosition: { x: 0, y: 0 },
  initialZoom: 1,
  zoom: 1,
  zoomMinFromInitial: 0.5,
  zoomMaxFromInitial: 50,
  touchZoomSensitivity: 0.5,
  wheelZoomStep: 0.05,
  // オフセットの初期値
  offsetOrigin: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },

  rotation: 0,

  verticalFlipped: false,
  horizontalFlipped: false,

  isDragging: false,

  selectionEditMode: 'replace',

  isCanvasSizeFrameMode: false,
  canvasSizeFrameOffset: { x: 0, y: 0 },
  canvasSizeFrameSize: { width: 0, height: 0 },
};
