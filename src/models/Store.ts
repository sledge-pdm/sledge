import { createPen } from "./data/Pen";
import { createLayer, LayerType } from "./data/Layer";
import { createStore } from "solid-js/store";
import { createCanvas } from "./data/Canvas";

// canvas
export const [canvasStore, setCanvasStore] = createStore({
  canvas: createCanvas(100, 200),
});

// metric
export const [metricStore, setMetricStore] = createStore({
  zoom: 1.0,
  adjustZoomOnCanvasChange: true,
  lastMouseCanvas: { x: 0, y: 0 },
  lastMouseLayer: { x: 0, y: 0 },
});

// layer
const DEFAULT_IMAGE_LAYER = createLayer("image1", LayerType.Image);
const DEFAULT_LAYERS = [
  createLayer("dot1", LayerType.Dot, true, 2),
  createLayer("auto1", LayerType.Automate, false),
  createLayer("dot2", LayerType.Dot),
  createLayer("dot3", LayerType.Dot),
];

export const [layerStore, setLayerStore] = createStore({
  imageLayer: DEFAULT_IMAGE_LAYER,
  layers: DEFAULT_LAYERS,
  activeLayerId: DEFAULT_LAYERS[0].id,
});

export const allLayers = () => [layerStore.imageLayer, ...layerStore.layers];

// color
export const [colorStore, setColorStore] = createStore({
  swatches: [
    "#000000",
    "#FFFFFF",
    "#ffff00",
    "#00ffff",
    "#00ff00",
    "#ff00ff",
    "#ff0000",
    "#0000ff",
    "#000080",
    "#400080",
  ],
});

// pen
export const [penStore, setPenStore] = createStore({
  usingIndex: 0,
  pens: [createPen("pen", 2, "#000000"), createPen("eraser", 4, "none")],
});
