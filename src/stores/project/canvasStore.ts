import { createStore } from 'solid-js/store';

// canvas

export const [canvasStore, setCanvasStore] = createStore({
  canvas: {
    width: 400,
    height: 400,
  },
  canvasAreaSize: { width: 0, height: 0 },
  canvasElementSize: { width: 0, height: 0 },
  lastMouseWindow: { x: 0, y: 0 },
  lastMouseOnCanvas: { x: 0, y: 0 },
  isInStroke: false,
  zoom: 1,
  zoomMin: 0.5,
  zoomMax: 8,
  touchZoomSensitivity: 0.5,
  wheelZoomStep: 0.05,
  // オフセットの初期値
  offsetOrigin: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },

  isCtrlPressed: false,
  isDragging: false,
});
