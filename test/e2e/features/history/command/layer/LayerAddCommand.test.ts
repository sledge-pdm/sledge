import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LayerAddCommand } from '~/features/history/command/layer/LayerAddCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../helpers';

describe('LayerAddCommand (e2e)', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    canvas = setupWebGL();
    const base = buildLayer('base');
    resetStore([base]);
    registerLayers([base], projectStore.canvas.size.width, projectStore.canvas.size.height);
  });

  afterEach(() => {
    layerManager.disposeAll();
    canvas.remove();
  });

  it('applies, undoes, and redoes layer insertions', () => {
    const command = new LayerAddCommand({
      index: 1,
      layer: { name: 'new' },
      initImage: new Uint8ClampedArray(4),
      uniqueName: false,
      overrideLayerId: 'layer-1',
    });

    command.forward();
    expect(projectStore.layers.layers).toHaveLength(2);
    expect(projectStore.layers.layers[1].id).toBe('layer-1');
    expect(projectStore.layers.state.activeLayerId).toBe('layer-1');

    command.backward();
    expect(projectStore.layers.layers).toHaveLength(1);
    expect(projectStore.layers.layers[0].id).toBe('base');

    command.forward();
    expect(projectStore.layers.layers).toHaveLength(2);
    expect(projectStore.layers.layers[1].id).toBe('layer-1');
  });
});
