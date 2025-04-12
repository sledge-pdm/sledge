import { Component, createSignal } from "solid-js";
import { initLayer } from "~/models/layer/layerImage";
import {
  allLayers,
  canvasStore,
  layerStore,
  setCanvasStore,
  updateDSL,
} from "~/stores/Store";

import styles from "./canvas_settings.module.css";

const CanvasSettings: Component<{}> = (props) => {
  const [width, setWidth] = createSignal(canvasStore.canvas.width);
  const [height, setHeight] = createSignal(canvasStore.canvas.height);

  const changeCanvasSize = (e: any) => {
    e.preventDefault();
    setCanvasStore("canvas", "width", width);
    setCanvasStore("canvas", "height", height);

    allLayers().forEach((layer, i) => {
      initLayer(layer.id, layer.dotMagnification);
      updateDSL(layer.id);
    });
  };

  const resetAllLayers = (e: any) => {
    layerStore.layers.forEach((l) => {
      initLayer(l.id, l.dotMagnification);
    });
  };

  return (
    <div class={styles.root}>
      <p class={styles.caption}>canvas.</p>

      <form class={styles.size_form} onSubmit={(e) => changeCanvasSize(e)}>
        <div>
          <p>width</p>
          <input
            class={styles.size_input}
            type="number"
            name="width"
            onChange={(e) => setWidth(Number(e.target.value))}
            value={width()}
            min={0}
            max={1200}
            required
          />
        </div>
        <div>
          <p>width</p>
          <input
            class={styles.size_input}
            type="number"
            name="height"
            onChange={(e) => setHeight(Number(e.target.value))}
            value={height()}
            min={0}
            max={1200}
            required
          />
        </div>
        <button class={styles.button} type="submit">
          change
        </button>
      </form>

      <button class={styles.button} onClick={resetAllLayers}>
        RESET ALL LAYERS
      </button>
    </div>
  );
};

export default CanvasSettings;
