import { Component, createEffect, createMemo, onCleanup } from 'solid-js';
import { StrokeCanvas } from './StrokeCanvas';

import { css } from '@acab/ecsstatic';
import { ImagePool } from '~/components/canvas/stacks/image_pool/ImagePool';
import FrascoCanvas, { notifyCanvasLayoutReady } from './FrascoCanvas';

import { interactStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import CheckerboardPattern from '/assets/patterns/CheckerboardPattern.svg';

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
    const { width, height } = projectStore.canvas.size;

    const zoom = Math.max(interactStore.zoom, 0.0001);
    const shorter = width > height ? height : width;
    const effectiveShorter = shorter / zoom;
    if (!Number.isFinite(effectiveShorter) || effectiveShorter <= 0) return 1;
    const order = Math.floor(Math.log10(effectiveShorter)) - 1;
    let gridSize = Math.pow(10, order);
    return Math.min(100, Math.max(1, gridSize));
  });

  createEffect(() => {
    const { width, height } = projectStore.canvas.size;
    const frame = requestAnimationFrame(() => {
      notifyCanvasLayoutReady({ width, height });
    });

    onCleanup(() => {
      cancelAnimationFrame(frame);
    });
  });

  return (
    <div
      class={canvasStackContainer}
      style={{
        width: `${projectStore.canvas.size.width}px`,
        height: `${projectStore.canvas.size.height}px`,
      }}
    >
      <div
        id='canvas-stack'
        class={canvasStack}
        style={{
          width: `${projectStore.canvas.size.width}px`,
          height: `${projectStore.canvas.size.height}px`,
          'background-image': `url("${CheckerboardPattern}")`,
          'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
          'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
        }}
      >
        <FrascoCanvas />
        <StrokeCanvas />
        <ImagePool />
      </div>
    </div>
  );
};

export default CanvasStack;
