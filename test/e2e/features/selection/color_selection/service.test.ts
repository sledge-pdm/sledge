import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import {
  applyColorSelection,
  resetColorSelectionState,
  setColorSelectionMode,
  setColorSelectionTarget,
  setColorSelectionTargetColor,
  setColorSelectionThreshold,
} from '~/features/selection/color_selection';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { disposeFrascoRenderer, initFrascoRenderer } from '~/webgl/FrascoRenderer';
import { buildLayer, resetStore, setupWebGL } from '../../history/helpers';

describe('color selection service (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    historyManager.clearHistory();
    selectionManager.clearAll();
    resetColorSelectionState();
  });

  afterEach(() => {
    resetColorSelectionState();
    selectionManager.clearAll();
    historyManager.clearHistory();
    disposeFrascoRenderer();
    layerManager.disposeAll();
    canvas.remove();
  });

  it('replaces the existing selection and clears it when no pixels match', () => {
    const layer = buildLayer('layer-1');
    resetStore([layer], { width: 2, height: 1 });
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([0, 0, 255, 255, 255, 0, 0, 255]), 2, 1, { inputSpace: 'layer' });

    setColorSelectionTarget('layer');
    setColorSelectionThreshold(0);
    setColorSelectionTargetColor([255, 0, 0, 255]);

    const matched = applyColorSelection();
    expect(matched).toBe(true);
    expect(Array.from(selectionManager.getBack()!.getMask())).toEqual([0, 1]);

    setColorSelectionTargetColor([0, 255, 0, 255]);
    const cleared = applyColorSelection();
    expect(cleared).toBe(false);
    expect(selectionManager.getBack()).toBeUndefined();
  });

  it('changes results between layer target and canvas target', () => {
    const active = buildLayer('layer-active');
    const visible = buildLayer('layer-visible');

    resetStore([active, visible], { width: 1, height: 1 });
    setProjectStore('layers', 'state', 'activeLayerId', active.id);

    layerManager.registerLayer(active.id, new Uint8ClampedArray([0, 0, 0, 0]), 1, 1, { inputSpace: 'layer' });
    layerManager.registerLayer(visible.id, new Uint8ClampedArray([0, 255, 0, 255]), 1, 1, { inputSpace: 'layer' });

    initFrascoRenderer(canvas, {
      width: projectStore.canvas.size.width,
      height: projectStore.canvas.size.height,
      layers: projectStore.layers.layers,
    });

    setColorSelectionThreshold(0);
    setColorSelectionTargetColor([0, 255, 0, 255]);

    setColorSelectionTarget('layer');
    expect(applyColorSelection()).toBe(false);
    expect(selectionManager.getBack()).toBeUndefined();

    setColorSelectionTarget('canvas');
    expect(applyColorSelection()).toBe(true);
    expect(Array.from(selectionManager.getBack()!.getMask())).toEqual([1]);
  });

  it('adds matched pixels onto the existing selection', () => {
    const layer = buildLayer('layer-1');
    resetStore([layer], { width: 2, height: 1 });
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([0, 0, 255, 255, 255, 0, 0, 255]), 2, 1, { inputSpace: 'layer' });

    selectionManager.setBack(new SelectionMask(2, 1, new Uint8Array([1, 0])));

    setColorSelectionTarget('layer');
    setColorSelectionMode('add');
    setColorSelectionThreshold(0);
    setColorSelectionTargetColor([255, 0, 0, 255]);

    expect(applyColorSelection()).toBe(true);
    expect(Array.from(selectionManager.getBack()!.getMask())).toEqual([1, 1]);
  });

  it('subtracts matched pixels from the existing selection', () => {
    const layer = buildLayer('layer-1');
    resetStore([layer], { width: 2, height: 1 });
    layerManager.registerLayer('layer-1', new Uint8ClampedArray([0, 0, 255, 255, 255, 0, 0, 255]), 2, 1, { inputSpace: 'layer' });

    selectionManager.setBack(new SelectionMask(2, 1, new Uint8Array([1, 1])));

    setColorSelectionTarget('layer');
    setColorSelectionMode('subtract');
    setColorSelectionThreshold(0);
    setColorSelectionTargetColor([255, 0, 0, 255]);

    expect(applyColorSelection()).toBe(true);
    expect(Array.from(selectionManager.getBack()!.getMask())).toEqual([1, 0]);
  });
});
