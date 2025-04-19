import { Component, createEffect, createSignal } from "solid-js";
import { initLayer } from "~/models/layer/layerImage";
import { canvasStore, setCanvasStore } from "~/stores/project/canvasStore";
import { allLayers, layerStore } from "~/stores/project/layerStore";

import { adjustZoomToFit } from "~/stores/project/canvasStore";
import { updateDSL } from "~/stores/project/imageStore";
import { sectionCaption, sectionContent, sectionRoot } from "~/styles/section_global.css";
import { canvasSizeButton, canvasSizeForm, canvasSizeInput, canvasSizeLabel } from "~/styles/section/canvas.css";

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
    <div class={sectionRoot}>
      <p class={sectionCaption}>canvas.</p>

      <form class={sectionContent} onSubmit={(e) => {
        changeCanvasSize(e)
      }}>
        <div class={canvasSizeForm}>
          <div>
            <p class={canvasSizeLabel}>width</p>
            <input
              class={canvasSizeInput}
              type="number"
              name="width"
              onChange={(e) => setWidth(Number(e.target.value))}
              value={width()}
              min={0}
              max={10000}
              required
            />
          </div>
          <div>
            <p class={canvasSizeLabel}>height</p>
            <input
              class={canvasSizeInput}
              type="number"
              name="height"
              onChange={(e) => setHeight(Number(e.target.value))}
              value={height()}
              min={0}
              max={10000}
              required
            />
          </div>
          <button class={canvasSizeButton} type="submit">
            change
          </button>
        </div>
      </form>

      <button class={canvasSizeButton} onClick={resetAllLayers}>
        RESET ALL LAYERS
      </button>
    </div>
  );
};

export default CanvasSettings;
