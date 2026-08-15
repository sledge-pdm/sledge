import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { buildColorSelectionSource } from '~/features/selection/color_selection';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { disposeFrascoRenderer, initFrascoRenderer } from '~/webgl/FrascoRenderer';
import { buildLayer, resetStore, setupWebGL } from '../../history/helpers';

describe('color selection source (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();

    const active = buildLayer('layer-active');
    const hidden = { ...buildLayer('layer-hidden'), enabled: false };
    const visible = buildLayer('layer-visible');

    resetStore([active, hidden, visible], { width: 1, height: 1 });
    setProjectStore('layers', 'state', 'activeLayerId', active.id);

    layerManager.registerLayer(active.id, new Uint8ClampedArray([0, 0, 0, 0]), 1, 1, { inputSpace: 'layer' });
    layerManager.registerLayer(hidden.id, new Uint8ClampedArray([255, 0, 0, 255]), 1, 1, { inputSpace: 'layer' });
    layerManager.registerLayer(visible.id, new Uint8ClampedArray([0, 255, 0, 255]), 1, 1, { inputSpace: 'layer' });

    initFrascoRenderer(canvas, {
      width: projectStore.canvas.size.width,
      height: projectStore.canvas.size.height,
      layers: projectStore.layers.layers,
    });
  });

  afterEach(() => {
    disposeFrascoRenderer();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('uses the active layer for layer target', () => {
    const source = buildColorSelectionSource('layer');

    expect(source).toBeDefined();
    expect(Array.from(source!.buffer.slice(0, 4))).toEqual([0, 0, 0, 0]);
  });

  it('uses only visible composite layers for canvas target', () => {
    const source = buildColorSelectionSource('canvas');

    expect(source).toBeDefined();
    expect(Array.from(source!.buffer.slice(0, 4))).toEqual([0, 255, 0, 255]);
  });
});
