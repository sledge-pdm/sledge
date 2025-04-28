import { createStore } from 'solid-js/store';

// canvas

export const [canvasStore, setCanvasStore] = createStore({
  canvas: {
    width: 400,
    height: 400,
  },
});
