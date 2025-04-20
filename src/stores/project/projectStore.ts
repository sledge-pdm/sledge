import { trackStore } from "@solid-primitives/deep";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { canvasStore } from "./canvasStore";
import { imageStore } from "./imageStore";
import { layerStore } from "./layerStore";

// project
export const [projectStore, setProjectStore] = createStore({
  name: "",
  path: "",
  isProjectChangedAfterSave: false,
});

createEffect(() => {
  trackStore(canvasStore.canvas);
  trackStore(imageStore);
  trackStore(layerStore);
  setProjectStore("isProjectChangedAfterSave", true);
});
