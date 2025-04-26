import { Component, createEffect, createSignal, For, onMount } from "solid-js";
import { canvasStore } from "~/stores/project/canvasStore";
import { activeLayer, allLayers } from "~/stores/project/layerStore";

import LayerCanvasOperator from "~/models/layer_canvas/LayerCanvasOperator";
import TileLayerImageAgent from "~/models/layer_image/agents/TileLayerImageAgent";
import { LayerImageManager } from "~/models/layer_image/LayerImageManager";
import { globalStore } from "~/stores/global/globalStore";
import { canvasStack } from "~/styles/components/canvas/canvas_stack.css";
import CanvasOverlaySVG from "./CanvasOverlaySVG";
import { LayerCanvas, LayerCanvasRef } from "./LayerCanvas";
import { TouchableCanvas } from "./TouchableCanvas";
import Tile from "~/types/Tile";

export const layerImageManager = new LayerImageManager();

const CanvasStack: Component<{}> = (props) => {
  const layerCanvasRefs: {
    [id: string]: LayerCanvasRef;
  } = {};

  const [dirtyRects, setDirtyRects] = createSignal<Tile[]>();

  const activeCanvasRef = () => {
    const active = activeLayer();

    if (active) return layerCanvasRefs[active.id];
    else return undefined;
  };

  onMount(() => {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "z") {
        const active = activeLayer();
        if (active) {
          const agent = layerImageManager.getAgent(active.id);
          agent?.undo();
        }
      } else if (e.ctrlKey && e.key === "y") {
        const active = activeLayer();
        if (active) {
          const agent = layerImageManager.getAgent(active.id);
          agent?.redo();
        }
      }
    });
  });

  createEffect(() => {
    const active = activeLayer();

    if (active) {
      const agent = layerImageManager.getAgent(active.id);
      if (!agent) return;
      if (globalStore.showDirtyRects) {
        agent.setOnDrawingBufferChangeListener("stack_dirty_rect", () => {
          setDirtyRects([...getDirtyRects()]);
        });
        agent.setOnImageChangeListener("stack_dirty_rect", () => {
          setDirtyRects([...getDirtyRects()]);
        });
      } else {
        agent.clearOnImageChangeListener("stack_dirty_rect");
        agent.clearOnDrawingBufferChangeListener("stack_dirty_rect");
      }
    }
  });

  const getDirtyRects = () => {
    const active = activeLayer();
    if (active) {
      const agent = layerImageManager.getAgent(active.id);
      if (agent instanceof TileLayerImageAgent) {
        return (agent as TileLayerImageAgent).getDirtyTilesInAction();
      }
    }
    return [];
  };

  return (
    <div style={{
      position: "relative",
    }}>
      <div
        class={canvasStack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
        }}
      >
        <TouchableCanvas
          operator={new LayerCanvasOperator(() => activeCanvasRef()!!)}
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
      <CanvasOverlaySVG
        dirtyRects={globalStore.showDirtyRects ? dirtyRects() : undefined}
      />
    </div>
  );
};

export default CanvasStack;
