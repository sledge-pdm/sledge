import { Component, createEffect, createMemo, onCleanup } from 'solid-js';
import { StrokeCanvas } from './StrokeCanvas';

import { css } from '@acab/ecsstatic';
import { ImagePool } from '~/components/canvas/stacks/image_pool/ImagePool';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import WebGLCanvas from './WebGLCanvas';

import CheckerboardPattern from '/patterns/CheckerboardPattern.svg';

const canvasStackContainer = css`
  position: relative;
  overflow: visible;
  background-color: var(--color-canvas);
`;
const canvasStack = css`
  position: relative;
  shape-rendering: crispEdges;
  image-rendering: pixelated;
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
      class={canvasStackContainer}
      style={{
        width: `${canvasStore.canvas.width}px`,
        height: `${canvasStore.canvas.height}px`,
      }}
    >
      <div
        id='canvas-stack'
        class={canvasStack}
        style={{
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
          'background-image': `url("${CheckerboardPattern}")`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
        }}
      >
        <WebGLCanvas />
        <StrokeCanvas />
        <ImagePool />
      </div>
    </div>
  );
};

export default CanvasStack;
