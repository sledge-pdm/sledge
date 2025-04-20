import { Component } from "solid-js";
import { canvasStore } from "~/stores/project/canvasStore";
import { activeLayer, layerStore } from "~/stores/project/layerStore";

import {
  isRedoPossible,
  isUndoPossible,
  redo,
  undo,
} from "~/models/layer/history";

import styles from "@styles/components/canvas/controls.module.css";

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
        {/* <ImportImageButton />
        <p class={styles.button} onClick={() => exportActiveLayerUpscaled()}>
          export
        </p> */}
      </div>
      <div class={styles["top-right-nav"]}>
        <img
          class={styles.undo_redo}
          src="/undo.png"
          style={{
            opacity: isUndoPossible(layerStore.activeLayerId) ? "1.0" : "0.3",
            cursor: isUndoPossible(layerStore.activeLayerId)
              ? "pointer"
              : "unset",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            undo(layerStore.activeLayerId);
          }}
        />
        <img
          class={styles.undo_redo}
          src="/redo.png"
          style={{
            opacity: isRedoPossible(layerStore.activeLayerId) ? "1.0" : "0.3",
            cursor: isRedoPossible(layerStore.activeLayerId)
              ? "pointer"
              : "unset",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            redo(layerStore.activeLayerId);
          }}
        />

        {/* <DSLEditor /> */}
      </div>
    </>
  );
};

export default Controls;
