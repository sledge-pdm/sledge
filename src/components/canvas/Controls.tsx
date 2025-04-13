import { Component } from "solid-js";
import { metricStore } from '~/stores/metricStore';
import { activeLayer, layerStore } from '~/stores/layerStore';

import ImportImageButton from "~/components/common/ImportImageButton";
import { redo, undo } from "~/models/layer/history";
import { exportActiveLayerUpscaled } from "~/utils/export";

import styles from "@styles/components/canvas/controls.module.css";

const Controls: Component<{}> = (props) => {
  // const zoom = () => metricStore.zoom;
  const lastMouseWindow = () => metricStore.lastMouseWindow;
  const lastMouseOnCanvas = () => metricStore.lastMouseOnCanvas;

  return (
    <>
      <p>canvas.</p>
      <p>
        ({lastMouseWindow().x}, {lastMouseWindow().y}) ON WINDOW.
      </p>
      <p>
        ({lastMouseOnCanvas().x}, {lastMouseOnCanvas().y}) ON CANVAS.
      </p>
      {/* <p>x{zoom().toFixed(2)}</p> */}
      <p>active: {activeLayer()?.name}</p>
      <p>
        offset:({metricStore.offset.x}, {metricStore.offset.y})
      </p>
      {/* <p>UNDO STACKS.</p>
        <For each={activeImage()?.undoStack}>
            {item =>
                <p>{item.toString()}</p>
            }
        </For> */}
      <div class={styles["top-right-button-container"]}>
        <ImportImageButton />
        <p class={styles.button} onClick={() => exportActiveLayerUpscaled()}>
          export
        </p>
      </div>
      <div class={styles["top-right-nav"]}>
        <p
          class={styles.undo_redo}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            undo(layerStore.activeLayerId);
          }}
        >
          &lt;&lt;
        </p>
        <p
          class={styles.undo_redo}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            redo(layerStore.activeLayerId);
          }}
        >
          &gt;&gt;
        </p>

        {/* <DSLEditor /> */}
      </div>
    </>
  );
};

export default Controls;
