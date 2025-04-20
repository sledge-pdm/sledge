import { Component, createEffect, createSignal, For, onMount } from "solid-js";
import { canvasStore } from "~/stores/project/canvasStore";
import {
  activeLayer,
  allLayers,
  layerStore,
} from "~/stores/project/layerStore";

import styles from "@styles/components/canvas/canvas_stack.module.css";

import CanvasOverlaySVG from "./CanvasOverlaySVG";
import { LayerCanvas, LayerCanvasRef } from "./LayerCanvas";
import { TouchableCanvas } from "./TouchableCanvas";
import LayerCanvasOperator from "~/models/layer_canvas/LayerCanvasOperator";
import { LayerImageManager } from "~/models/layer_image/LayerImageManager";
import TileLayerImageAgent from "~/models/layer_image/agents/TileLayerImageAgent";
import { redo, undo } from "~/models/layer/history";
import Tile from "~/models/layer_image/Tile";

const CanvasStack: Component<{}> = (props) => {
  const layerCanvasRefs: {
    [id: string]: LayerCanvasRef;
  } = {};

  const [dirtyRects, setDirtyRects] = createSignal<Tile[]>();

  const layerImageManager = new LayerImageManager();

  const activeCanvasRef = () => {
    const active = activeLayer();

    if (active) return layerCanvasRefs[active.id];
    else return undefined;
  };

  onMount(() => {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "z") {
        undo(layerStore.activeLayerId);
      } else if (e.ctrlKey && e.key === "y") {
        redo(layerStore.activeLayerId);
      }
    });
  });

  createEffect(() => {
    const active = activeLayer();

    if (active) {
      const agent = layerImageManager.getAgent(active.id);
      console.log(agent)
      if (!agent) return;
      agent.setOnDrawingBufferChangeListener("stack_dirty_rect", () => {
        setDirtyRects([...getDirtyRects()]);
      })
      agent.setOnImageChangeListener("stack_dirty_rect", () => {
        setDirtyRects([...getDirtyRects()]);
      })
    }
  })

  const getDirtyRects = () => {
    const active = activeLayer();
    if (active) {
      const agent = layerImageManager.getAgent(active.id);
      if (agent instanceof TileLayerImageAgent) {
        return (agent as TileLayerImageAgent).getDirtyTiles();
      }
    }
    return [];
  }

  return (
    <div style={{ position: "relative" }}>
      <CanvasOverlaySVG dirtyRects={dirtyRects()} />

      <div
        class={styles.canvas_stack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
        }}
      >
        <TouchableCanvas operator={new LayerCanvasOperator(() => activeCanvasRef()!!)} />

        <For each={allLayers()}>
          {(layer, index) => (
            <LayerCanvas manager={layerImageManager}
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
