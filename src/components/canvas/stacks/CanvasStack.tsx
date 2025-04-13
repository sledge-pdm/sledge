import { Component, For, onMount } from "solid-js";
import { canvasStore } from '~/stores/canvasStore';
import { activeLayer, allLayers, layerStore } from '~/stores/layerStore';

import styles from "@styles/components/canvas/canvas_stack.module.css";

import { cloneImageData } from "~/models/factories/utils";
import { DrawState, getDrawnImageData } from "~/models/layer/getDrawnImageData";
import { registerNewHistory } from "~/models/layer/layerImage";
import { LayerCanvas, LayerCanvasRef } from "./LayerCanvas";
import { TouchableCanvas } from "./TouchableCanvas";
import { redo, undo } from "~/models/layer/history";

const CanvasStack: Component<{}> = (props) => {

  const layerCanvasRefs: {
    [id: string]: LayerCanvasRef;
  } = {};

  const activeCanvasRef = () => {
    const active = activeLayer();

    if (active) return layerCanvasRefs[active.id];
    else return
  }

  onMount(() => {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "z") {
        undo(layerStore.activeLayerId);
        activeCanvasRef()?.update();
      } else if (e.ctrlKey && e.key === "y") {
        redo(layerStore.activeLayerId);
        activeCanvasRef()?.update();
      }
    });
  });

  const handleDraw = (
    type: DrawState,
    position: { x: number; y: number },
    lastPos?: { x: number; y: number },
  ) => {
    switch (type) {
      case DrawState.start:
        console.log("stroke start.")
        break;
      case DrawState.move:
        console.log("stroke move.")
        break;
      case DrawState.end:
        console.log("stroke end.")
        break;
    }

    const active = activeLayer();

    if (active) {
      const activeRef = layerCanvasRefs[active.id];
      if (type === DrawState.start) {
        activeRef.initDrawingBuffer();
      } else {
        const drawingBuffer = activeRef.getDrawingBuffer();
        if (drawingBuffer) {
          const newImageData = getDrawnImageData(
            active.id,
            type,
            drawingBuffer,
            position,
            lastPos,
          );

          if (newImageData) {
            activeRef.setImageData(newImageData);
            if (type === DrawState.end) {
              activeRef.resetDrawingBuffer();
              registerNewHistory(active.id, cloneImageData(newImageData));
            }
          }
        }
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        class={styles.canvas_stack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
        }}
      >
        <TouchableCanvas
          onStrokeStart={(p, lp) => handleDraw(DrawState.start, p, lp)}
          onStrokeMove={(p, lp) => handleDraw(DrawState.move, p, lp)}
          onStrokeEnd={(p, lp) => handleDraw(DrawState.end, p, lp)}
        />

        <For each={allLayers()}>
          {(layer, index) => (
            <LayerCanvas
              ref={layerCanvasRefs[layer.id]}
              layer={layer}
              zIndex={allLayers().length - index()}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default CanvasStack;
