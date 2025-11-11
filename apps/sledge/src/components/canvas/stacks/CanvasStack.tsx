import { Component, createEffect, createMemo, onCleanup } from 'solid-js';
import LayerCanvasOperator from '~/features/canvas/LayerCanvasOperator';
import { InteractCanvas } from './InteractCanvas';

import { css } from '@acab/ecsstatic';
import { ImagePool } from '~/components/canvas/overlays/image_pool/ImagePool';
import { activeLayer } from '~/features/layer';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
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
  const gridSize = createMemo(() => {
    const { width, height } = canvasStore.canvas;

    const shorter = width > height ? height : width;
    let canvasStoreOrder = Math.floor(Math.log10(shorter)) - 1;
    let gridSize = Math.pow(10, canvasStoreOrder);
    if (gridSize < 1) {
      gridSize = 1;
    } else if (gridSize > 100) {
      gridSize = 100;
    }
    return gridSize;
  });

  createEffect(() => {
    const { width, height } = canvasStore.canvas;
    const frame = requestAnimationFrame(() => {
      eventBus.emit('canvas:layoutReady', { newSize: { width, height } });
    });

    onCleanup(() => {
      cancelAnimationFrame(frame);
    });
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
          'image-rendering': 'pixelated',
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
