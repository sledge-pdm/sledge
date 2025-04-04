import { createPen } from "./data/Pen";
import { createLayer, LayerType } from "./data/Layer";
import { createStore } from "solid-js/store";
import { createCanvas } from "./data/Canvas";
import { LayerImageState } from "./data/LayerImage";

// canvas
export const [canvasStore, setCanvasStore] = createStore({
  canvas: createCanvas(200, 200),
});

// metric
export const [metricStore, setMetricStore] = createStore({
  zoom: 1.0,
  adjustZoomOnCanvasChange: true,
  lastMouseCanvas: { x: 0, y: 0 },
  lastMouseLayer: { x: 0, y: 0 },
});

// image
export const [imageStore, setImageStore] = createStore<
  Record<string, LayerImageState>
>({});

// layer
const DEFAULT_IMAGE_LAYER = createLayer("image1", LayerType.Image);
const DEFAULT_LAYERS = [
  createLayer("dot1", LayerType.Dot, true, 1),
  createLayer("auto1", LayerType.Automate, false),
  createLayer("dot2", LayerType.Dot, true, 2),
  createLayer("dot3", LayerType.Dot, true, 4),
];

export const [layerStore, setLayerStore] = createStore({
  imageLayer: DEFAULT_IMAGE_LAYER,
  layers: DEFAULT_LAYERS,
  activeLayerId: DEFAULT_LAYERS[0].id,
});

export const allLayers = () => [layerStore.imageLayer, ...layerStore.layers];
export const activeLayer = () =>
  allLayers().find((layer) => layer.id === layerStore.activeLayerId);

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

// "#rrggbb" -> r/g/b
export function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// pen
export const [penStore, setPenStore] = createStore({
  usingIndex: 0,
  pens: [createPen("pen", 1, "#000000"), createPen("eraser", 4, "none")],
});
