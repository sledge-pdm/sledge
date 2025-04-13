import { createStore } from "solid-js/store";
import { createPen } from "~/models/factories/createPen";

// pen

export const [penStore, setPenStore] = createStore({
  usingIndex: 0,
  pens: [createPen("pen", 1, "#000000"), createPen("eraser", 4, "none")],
});
export const currentPen = () => penStore.pens[penStore.usingIndex];
