import { Component, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { StrokeCanvas } from './StrokeCanvas';

import { css } from '@acab/ecsstatic';
import FrascoCanvas, { notifyCanvasLayoutReady } from './FrascoCanvas';

import { interactStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { ImagePool } from '../overlays/image_pool/ImagePool';

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
const checkerboardCanvas = css`
  position: absolute;
  top: 0;
  left: 0;
  image-rendering: pixelated;
`;

function drawCheckerboard(canvas: HTMLCanvasElement, width: number, height: number, gridSize: number, dpr: number): void {
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2x2のタイルを作成して pattern で繰り返し描画する
  // tileSize は物理ピクセル単位 (gridSize × dpr)
  const tileSize = Math.max(1, Math.round(gridSize * dpr));
  const tile = document.createElement('canvas');
  tile.width = tileSize * 2;
  tile.height = tileSize * 2;
  const tileCtx = tile.getContext('2d');
  if (!tileCtx) return;

  // SVGの #00000010 (rgba 0,0,0,~0.063) に合わせた暗色セル
  tileCtx.fillStyle = 'rgba(0, 0, 0, 0.063)';
  tileCtx.fillRect(0, 0, tileSize, tileSize);
  tileCtx.fillRect(tileSize, tileSize, tileSize, tileSize);

  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const CanvasStack: Component = () => {
  let checkerboardRef: HTMLCanvasElement | undefined;

  const [dpr, setDpr] = createSignal(window.devicePixelRatio);

  onMount(() => {
    let mql: MediaQueryList;
    const onDprChange = () => {
      setDpr(window.devicePixelRatio);
      register();
    };
    const register = () => {
      mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mql.addEventListener('change', onDprChange, { once: true });
    };
    register();
    onCleanup(() => mql?.removeEventListener('change', onDprChange));
  });

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
    const gs = gridSize();
    const ratio = dpr();
    if (checkerboardRef) {
      drawCheckerboard(checkerboardRef, width, height, gs, ratio);
    }
  });

  let rafId: number | undefined;
  createEffect(() => {
    const { width, height } = projectStore.canvas.size;
    rafId = requestAnimationFrame(() => {
      notifyCanvasLayoutReady({ width, height });
    });
  });

  onCleanup(() => {
    if (rafId) cancelAnimationFrame(rafId);
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
        }}
      >
        <canvas
          ref={checkerboardRef}
          class={checkerboardCanvas}
          style={{
            width: `${projectStore.canvas.size.width}px`,
            height: `${projectStore.canvas.size.height}px`,
          }}
        />
        <FrascoCanvas />
        <StrokeCanvas />
        <ImagePool />
      </div>
    </div>
  );
};

export default CanvasStack;
