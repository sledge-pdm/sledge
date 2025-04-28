import { Component, createEffect, createSignal, For, onMount } from 'solid-js';
import LayerCanvasOperator from '~/controllers/canvas/LayerCanvasOperator';
import TileLayerImageAgent from '~/models/layer_image/agents/TileLayerImageAgent';
import CanvasOverlaySVG from './CanvasOverlaySVG';
import { LayerCanvas, LayerCanvasRef } from './LayerCanvas';
import { TouchableCanvas } from './TouchableCanvas';

import { activeLayer, allLayers } from '~/controllers/layer_list/LayerListController';
import { layerImageManager } from '~/routes/editor';
import { canvasStack } from '~/styles/components/canvas/canvas_stack.css';
import Tile from '~/types/Tile';
import { canvasStore } from '~/stores/ProjectStores';

const CanvasStack: Component = () => {
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
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        const active = activeLayer();
        if (active) {
          const agent = layerImageManager.getAgent(active.id);
          agent?.undo();
        }
      } else if (e.ctrlKey && e.key === 'y') {
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
      agent.setOnDrawingBufferChangeListener('stack_dirty_rect', () => {
        setDirtyRects([...getDirtyRects()]);
      });
      agent.setOnImageChangeListener('stack_dirty_rect', () => {
        setDirtyRects([...getDirtyRects()]);
      });
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
    <div
      style={{
        position: 'relative',
      }}
    >
      <div
        class={canvasStack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
        }}
      >
        <TouchableCanvas operator={new LayerCanvasOperator(() => activeCanvasRef()!)} />

        <For each={allLayers()}>
          {(layer, index) => (
            <LayerCanvas ref={layerCanvasRefs[layer.id]} layer={layer} zIndex={allLayers().length - index()} />
          )}
        </For>
      </div>

      <CanvasOverlaySVG dirtyRects={dirtyRects()} />
    </div>
  );
};

export default CanvasStack;
