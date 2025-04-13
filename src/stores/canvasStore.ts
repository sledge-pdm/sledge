import { createStore } from "solid-js/store";
import { createCanvas } from "~/models/types/Canvas";

// canvas

export const [canvasStore, setCanvasStore] = createStore({
  canvas: createCanvas(400, 400),
});
