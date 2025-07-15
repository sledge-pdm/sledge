import { Component, createEffect, createSignal, onMount } from 'solid-js';
import LayerCanvasOperator from '~/controllers/canvas/LayerCanvasOperator';
import CanvasOverlaySVG from './CanvasOverlaySVG';
import { InteractCanvas } from './InteractCanvas';

import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { canvasStore } from '~/stores/ProjectStores';
import { canvasStack } from '~/styles/components/canvas/canvas_stack.css';
import { eventBus } from '~/utils/EventBus';
import { ImagePool } from './image_pool/ImagePool';
import WebGLCanvas from './WebGLCanvas';

const CanvasStack: Component = () => {
  const [gridSize, setGridSize] = createSignal(10);

  const updateGridSize = (width: number, height: number) => {
    const shorter = width > height ? height : width;
    let canvasStoreOrder = Math.floor(Math.log10(shorter));
    canvasStoreOrder -= 1;

    let gridSize = Math.pow(10, canvasStoreOrder);
    if (gridSize < 1) {
      gridSize = 1;
    } else if (gridSize > 100) {
      gridSize = 100;
    }

    setGridSize(gridSize);
  };

  onMount(() => {
    const { width, height } = canvasStore.canvas;
    updateGridSize(width, height);
    eventBus.on('canvas:sizeChanged', ({ newSize }) => {
      const { width, height } = newSize;
      updateGridSize(width, height);
    });
  });

  createEffect(() => {
    const active = activeLayer();
    if (active) {
      const agent = getAgentOf(active.id);
      if (!agent) return;
    }
  });

  return (
    <div
      style={{
        position: 'relative',
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
      }}
    >
      <div
        class={canvasStack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
        }}
      >
        <InteractCanvas operator={new LayerCanvasOperator(() => activeLayer().id)} />

        <ImagePool />

        <WebGLCanvas />
      </div>

      <CanvasOverlaySVG />
    </div>
  );
};

export default CanvasStack;
