import { Component, createSignal } from "solid-js";
import { initLayer } from "~/models/layer/layerImage";
import { canvasStore, setCanvasStore } from "~/stores/canvasStore";
import { allLayers, layerStore } from "~/stores/layerStore";

import styles from "@styles/components/section/canvas.module.css";
import { adjustZoomToFit } from "~/stores/canvasStore";
import { updateDSL } from "~/stores/imageStore";

const CanvasSettings: Component<{}> = (props) => {
  const [width, setWidth] = createSignal(canvasStore.canvas.width);
  const [height, setHeight] = createSignal(canvasStore.canvas.height);

  const changeCanvasSize = (e: any) => {
    e.preventDefault();
    setCanvasStore("canvas", "width", width());
    setCanvasStore("canvas", "height", height());
    adjustZoomToFit(width(), height());

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
    <div class="section_root">
      <p class="section_caption">canvas.</p>

      <form class="section_content" onSubmit={(e) => changeCanvasSize(e)}>
        <div class="fl-row">
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
            <p>height</p>
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
        </div>
      </form>

      <button class={styles.button} onClick={resetAllLayers}>
        RESET ALL LAYERS
      </button>
    </div>
  );
};

export default CanvasSettings;
