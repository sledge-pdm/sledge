import { Component, For } from "solid-js";
import { canvasStore } from "~/stores/project/canvasStore";
import { activeLayer, layerStore } from "~/stores/project/layerStore";

import styles from "@styles/components/canvas/controls.module.css";
import { canRedo, canUndo } from "~/stores/project/layerImageStore";
import { layerImageManager } from "./stacks/CanvasStack";

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
      <p>zoom.</p>
      <p>x {canvasStore.zoom}</p>

      <p>UNDO STACKS.</p>
      <For
        each={layerImageManager
          .getAgent(activeLayer()?.id)
          ?.getHistoryManager()
          ?.getUndoStack()}
      >
        {(item, i) => {
          if (i() === 0) {
            <>
              <p>
                pixel diffs:{" "}
                {
                  item.diffs
                    .values()
                    .toArray()
                    .filter((d) => d.kind === "pixel").length
                }
                px.
              </p>
              <p>
                tile diffs:{" "}
                {
                  item.diffs
                    .values()
                    .toArray()
                    .filter((d) => d.kind === "tile").length
                }
                px.
              </p>
            </>;
          } else return <></>;
        }}
      </For>
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
            opacity: canUndo() ? "1.0" : "0.3",
            cursor: canUndo() ? "pointer" : "unset",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            layerImageManager.getAgent(layerStore.activeLayerId)?.undo();
          }}
        />
        <img
          class={styles.undo_redo}
          src="/redo.png"
          style={{
            opacity: canRedo() ? "1.0" : "0.3",
            cursor: canRedo() ? "pointer" : "unset",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            layerImageManager.getAgent(layerStore.activeLayerId)?.redo();
          }}
        />

        {/* <DSLEditor /> */}
      </div>
    </>
  );
};

export default Controls;
