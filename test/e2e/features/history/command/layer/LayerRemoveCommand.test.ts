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
});
