import { Component, createEffect, createMemo, onCleanup } from 'solid-js';
import { InteractArea } from './InteractCanvas';

import { css } from '@acab/ecsstatic';
import { ImagePool } from '~/components/canvas/overlays/image_pool/ImagePool';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import WebGLCanvas from './WebGLCanvas';

import { color } from '@sledge/theme';
import CheckerboardPattern from '/patterns/CheckerboardPattern.svg';

const canvasStack = css`
  position: relative;
`;
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
          'background-image': `url("${CheckerboardPattern}")`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
        }}
      >
        <InteractArea />
        <WebGLCanvas />
        <ImagePool />
      </div>
    </div>
  );
};

export default CanvasStack;
