import { Component, createEffect, createSignal, onMount } from 'solid-js';
import LayerCanvasOperator from '~/features/canvas/LayerCanvasOperator';
import { InteractCanvas } from './InteractCanvas';

import { css } from '@acab/ecsstatic';
import { ImagePool } from '~/components/canvas/overlays/image_pool/ImagePool';
import { activeLayer } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';
import WebGLCanvas from './WebGLCanvas';

import { color } from '@sledge/theme';
import createRAF, { targetFPS } from '@solid-primitives/raf';
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

  let orientationRef!: HTMLDivElement;

  let lastOrientationValues = {
    width: 0,
    height: 0,
    horizontalFlipped: false,
    verticalFlipped: false,
    rotation: 0,
  };

  const [isTransformUpdateRunning, startTransformUpdate, stopTransformUpdate] = createRAF(
    targetFPS(() => {
      updateTransform();
    }, 60)
  );

  const updateTransform = () => {
    const w = canvasStore.canvas.width;
    const h = canvasStore.canvas.height;
    const sx = interactStore.horizontalFlipped ? -1 : 1;
    const sy = interactStore.verticalFlipped ? -1 : 1;
    const rot = interactStore.rotation;

    // 差分検出による最適化
    if (
      lastOrientationValues.width !== w ||
      lastOrientationValues.height !== h ||
      lastOrientationValues.horizontalFlipped !== interactStore.horizontalFlipped ||
      lastOrientationValues.verticalFlipped !== interactStore.verticalFlipped ||
      lastOrientationValues.rotation !== rot
    ) {
      if (orientationRef) {
        const cx = w / 2;
        const cy = h / 2;
        // translate -> rotate -> scale -> translate back
        orientationRef.style.transform = `translate(${cx}px, ${cy}px) rotate(${rot}deg) scale(${sx}, ${sy}) translate(${-cx}px, ${-cy}px)`;
        orientationRef.style.transformOrigin = '0 0';
      }

      lastOrientationValues = {
        width: w,
        height: h,
        horizontalFlipped: interactStore.horizontalFlipped,
        verticalFlipped: interactStore.verticalFlipped,
        rotation: rot,
      };
    }
  };

  const handleCanvasSizeChanged = ({ newSize }: Events['canvas:sizeChanged']) => {
    const { width, height } = newSize;
    updateGridSize(width, height);
  };

  onMount(() => {
    const { width, height } = canvasStore.canvas;
    updateGridSize(width, height);

    eventBus.on('canvas:sizeChanged', handleCanvasSizeChanged);

    // 初回orientation更新
    updateTransform();
    startTransformUpdate();

    return () => {
      eventBus.off('canvas:sizeChanged', handleCanvasSizeChanged);
      stopTransformUpdate();
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
      }}
    >
      <div
        ref={(el) => (orientationRef = el)}
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: `${canvasStore.canvas.width}px`,
          height: `${canvasStore.canvas.height}px`,
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
    </div>
  );
};

export default CanvasStack;
