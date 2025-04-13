import { createStore } from "solid-js/store";
import { createCanvas } from "~/models/types/Canvas";

// canvas

export const adjustZoomToFit = (
  width?: number,
  height?: number,
  reference: number = 600,
) => {
  if (width === undefined) width = canvasStore.canvas.width;
  if (height === undefined) height = canvasStore.canvas.height;

  let isWide = width > height;
  let longerLength = isWide ? width : height;

  console.log(
    `this is ${isWide ? "wide" : "tall"}.
    ${reference} / ${longerLength} = ${reference / longerLength}. set zoom.`,
  );
  setCanvasStore("zoom", reference / longerLength);
  centeringCanvas();
};

export const centeringCanvas = () => {
  const canvasSize = canvasStore.canvas;
  const canvasArea = canvasStore.canvasAreaSize;
  const zoom = canvasStore.zoom;

  console.log(
    `area size is ${canvasArea.width} x ${canvasArea.height}.
    canvas size is ${canvasSize.width} x ${canvasSize.height}.
    current offset origin is ${canvasStore.offsetOrigin.x}, ${canvasStore.offsetOrigin.y}.
    new offset origin is ${canvasStore.canvasAreaSize.width / 2 - canvasStore.canvas.width / 2}, ${canvasStore.canvasAreaSize.height / 2 - canvasStore.canvas.height / 2}`,
  );

  setCanvasStore("offsetOrigin", {
    x: canvasArea.width / 2 - (canvasSize.width * zoom) / 2,
    y: canvasArea.height / 2 - (canvasSize.height * zoom) / 2,
  });
  setCanvasStore("offset", {
    x: 0,
    y: 0,
  });
};

export const [canvasStore, setCanvasStore] = createStore({
  canvas: createCanvas(400, 400),
  canvasAreaSize: { width: 0, height: 0 },
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
