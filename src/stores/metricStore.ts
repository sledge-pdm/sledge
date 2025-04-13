import { createStore } from "solid-js/store";

// metric
export const [metricStore, setMetricStore] = createStore({
  lastMouseWindow: { x: 0, y: 0 },
  lastMouseOnCanvas: { x: 0, y: 0 },
  isInStroke: false,
  zoom: 1,
  touchZoomSensitivity: 0.5,
  wheelZoomStep: 0.1,
  // オフセットの初期値
  offsetOrigin: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },

  isCtrlPressed: false,
  isDragging: false,
});
