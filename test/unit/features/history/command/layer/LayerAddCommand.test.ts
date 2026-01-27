import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerAddCommand } from '~/features/history/command/layer/LayerAddCommand';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from '../helpers';

vi.mock('~/webgl/service', () => ({
  updateWebGLCanvas: vi.fn(),
  updateLayerPreview: vi.fn(),
}));

describe('LayerAddCommand', () => {
  beforeEach(() => {
    resetStore([buildLayer('base')]);
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
