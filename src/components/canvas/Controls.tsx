import { Component } from "solid-js";
import { canvasStore } from "~/stores/canvasStore";
import { activeLayer, layerStore } from "~/stores/layerStore";

import ImportImageButton from "~/components/common/ImportImageButton";
import { exportActiveLayerUpscaled } from "~/io/export";
import { redo, undo } from "~/models/layer/history";

import styles from "@styles/components/canvas/controls.module.css";
import { exportProjectJson } from "~/io/project";

const Controls: Component<{}> = (props) => {
  // const zoom = () => canvasStore.zoom;
  const lastMouseWindow = () => canvasStore.lastMouseWindow;
  const lastMouseOnCanvas = () => canvasStore.lastMouseOnCanvas;

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
        offset:({canvasStore.offset.x}, {canvasStore.offset.y})
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
        <p class={styles.button} onClick={() => exportProjectJson()}>
          save
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
