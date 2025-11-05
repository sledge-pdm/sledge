import { Component, createSignal, onMount } from 'solid-js';
import LayerCanvasOperator from '~/features/canvas/LayerCanvasOperator';
import { InteractCanvas } from './InteractCanvas';

import { css } from '@acab/ecsstatic';
import { ImagePool } from '~/components/canvas/overlays/image_pool/ImagePool';
import { activeLayer } from '~/features/layer';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';
import WebGLCanvas from './WebGLCanvas';

import { color } from '@sledge/theme';
import '/patterns/CheckerboardPattern.svg';

const canvasStack = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: relative;
`;

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

  const handleCanvasSizeChanged = ({ newSize }: Events['canvas:sizeChanged']) => {
    const { width, height } = newSize;
    updateGridSize(width, height);
  };

  onMount(() => {
    const { width, height } = canvasStore.canvas;
    updateGridSize(width, height);

    eventBus.on('canvas:sizeChanged', handleCanvasSizeChanged);

    return () => {
      eventBus.off('canvas:sizeChanged', handleCanvasSizeChanged);
    };
  });

  return (
    <div
      style={{
        position: 'relative',
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
        overflow: 'visible',
        'transform-origin': '0 0',
        'background-color': color.canvas,
      }}
    >
      <div
        id='canvas-stack'
        class={canvasStack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
          'shape-rendering': 'crispEdges',
          'background-image': `url(/patterns/CheckerboardPattern.svg)`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
        }}
      >
        <InteractCanvas operator={layerCanvasOperator} />
        <ImagePool />
        <WebGLCanvas />
      </div>
    </div>
  );
};

export default CanvasStack;
