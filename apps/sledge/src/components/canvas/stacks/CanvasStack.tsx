import { Component, createSignal, onMount } from 'solid-js';
import LayerCanvasOperator from '~/controllers/canvas/LayerCanvasOperator';
import CanvasOverlaySVG from './CanvasOverlaySVG';
import { InteractCanvas } from './InteractCanvas';

import { vars } from '@sledge/theme';
import { OnCanvasSelectionMenu } from '~/components/canvas/overlays/SelectionMenu';
import { activeLayer } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { canvasStack } from '~/styles/components/canvas/canvas_stack.css';
import { eventBus } from '~/utils/EventBus';
import WebGLCanvas from './WebGLCanvas';
import { ImagePool } from '~/components/canvas/stacks/image_pool/ImagePool';

export const layerCanvasOperator = new LayerCanvasOperator(() => activeLayer().id);

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

  return (
    <div
      style={{
        position: 'relative',
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
        'background-color': vars.color.canvas,
        'transform-origin': 'center center',
        transform: `rotate(${interactStore.rotation}deg)`,
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
        <InteractCanvas operator={layerCanvasOperator} />

        <ImagePool />

        <WebGLCanvas />
      </div>
      <OnCanvasSelectionMenu />

      <CanvasOverlaySVG />
    </div>
  );
};

export default CanvasStack;
