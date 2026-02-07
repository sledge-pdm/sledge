import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LayerRemoveCommand } from '~/features/history/command/layer/LayerRemoveCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../helpers';

describe('LayerRemoveCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('removes and restores layers (with preserveActive)', () => {
    const base = buildLayer('base');
    const extra = buildLayer('layer-2');
    resetStore([base, extra]);
    registerLayers([base, extra], projectStore.canvas.size.width, projectStore.canvas.size.height);
    setProjectStore('layers', 'state', 'activeLayerId', 'base');

    const command = new LayerRemoveCommand({ layerId: extra.id, preserveActive: true });
    command.forward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['base']);
    expect(projectStore.layers.state.activeLayerId).toBe('base');

    command.backward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['base', 'layer-2']);
  });

  it('updates active layer when preserveActive is false', () => {
    const a = buildLayer('a');
    const b = buildLayer('b');
    const c = buildLayer('c');
    resetStore([a, b, c]);
    registerLayers([a, b, c], projectStore.canvas.size.width, projectStore.canvas.size.height);
    setProjectStore('layers', 'state', 'activeLayerId', 'c');

    const command = new LayerRemoveCommand({ layerId: 'b', preserveActive: false });
    command.forward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['a', 'c']);
    expect(projectStore.layers.state.activeLayerId).toBe('a');
  });

  it('restores packedSnapshot pixels on undo', () => {
    const base = buildLayer('base');
    const target = buildLayer('target');
    resetStore([base, target]);
    const buffer = new Uint8ClampedArray([4, 5, 6, 255]);
    registerLayers([base, target], projectStore.canvas.size.width, projectStore.canvas.size.height, buffer);

    const command = new LayerRemoveCommand({ layerId: 'target' });
    command.forward();
    expect(layerManager.getLayerOptional('target')).toBeUndefined();

    command.backward();
    expect(layerManager.readPixelCanvas('target', 0, 0)).toEqual([4, 5, 6, 255]);
  });
});
