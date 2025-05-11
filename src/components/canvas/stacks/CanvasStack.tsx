import { Component, createEffect, createSignal, Show } from 'solid-js';
import LayerCanvasOperator from '~/controllers/canvas/LayerCanvasOperator';
import CanvasOverlaySVG from './CanvasOverlaySVG';
import { InteractCanvas } from './InteractCanvas';

import { activeLayer } from '~/controllers/layer_list/LayerListController';
import { layerAgentManager } from '~/routes/editor';
import { globalStore } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { canvasStack } from '~/styles/components/canvas/canvas_stack.css';
import Tile from '~/types/Tile';
import WebGLCanvasStack from './WebglCanvasStack';

const CanvasStack: Component = () => {
  const [dirtyRects, setDirtyRects] = createSignal<Tile[]>();

  createEffect(() => {
    const active = activeLayer();
    if (active) {
      const agent = layerAgentManager.getAgent(active.id);
      if (!agent) return;
      agent.setOnImageChangeListener('stack_dirty_rect', () => {
        setDirtyRects([...getDirtyRects()]);
      });
    }
  });

  const getDirtyRects = () => {
    const active = activeLayer();
    if (active) {
      const agent = layerAgentManager.getAgent(active.id);
      return agent?.getTileManager().getDirtyTilesInAction() ?? [];
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
        <InteractCanvas operator={new LayerCanvasOperator(() => activeLayer().id)} />

        <Show when={globalStore.enableGLRender}>
          <WebGLCanvasStack />
        </Show>
      </div>

      <CanvasOverlaySVG dirtyRects={dirtyRects()} />
    </div>
  );
};

export default CanvasStack;
