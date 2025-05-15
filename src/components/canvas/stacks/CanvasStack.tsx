import { Component, createEffect, createSignal } from 'solid-js';
import LayerCanvasOperator from '~/controllers/canvas/LayerCanvasOperator';
import CanvasOverlaySVG from './CanvasOverlaySVG';
import { InteractCanvas } from './InteractCanvas';

import { layerAgentManager } from '~/controllers/layer/LayerAgentManager';
import { activeLayer } from '~/controllers/layer_list/LayerListController';
import { canvasStore } from '~/stores/ProjectStores';
import { canvasStack } from '~/styles/components/canvas/canvas_stack.css';
import Tile from '~/types/Tile';
import WebGLCanvas from './WebGLCanvas';

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

        <WebGLCanvas />
      </div>

      <CanvasOverlaySVG dirtyRects={dirtyRects()} />
    </div>
  );
};

export default CanvasStack;
