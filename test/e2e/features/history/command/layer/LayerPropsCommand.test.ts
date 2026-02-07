import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerPropsCommand } from '~/features/history/command/layer/LayerPropsCommand';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { buildLayer, resetStore } from '../../helpers';

vi.mock('~/webgl/service', () => ({
  updateFrascoCanvas: vi.fn(),
}));

describe('LayerPropsCommand (e2e)', () => {
  beforeEach(() => {
    resetStore([buildLayer('base')]);
  });

  it('applies forward/backward updates', () => {
    const layer = projectStore.layers.layers[0];
    const { id: _id, ...rest } = layer;
    const command = new LayerPropsCommand({
      layerId: layer.id,
      oldLayerProps: { ...rest },
      newLayerProps: { ...rest, opacity: 0.5 },
    });

    command.forward();
    expect(projectStore.layers.layers[0].opacity).toBe(0.5);

    command.backward();
    expect(projectStore.layers.layers[0].opacity).toBe(1);
  });

  it('supports registerBefore/registerAfter and hasDiff', () => {
    const layer = projectStore.layers.layers[0];
    const command = new LayerPropsCommand({ layerId: layer.id });

    command.registerBefore(layer);
    expect(command.hasDiff()).toBe(true);

    setProjectStore('layers', 'layers', 0, { ...layer, opacity: 0.5 });
    command.registerAfter(projectStore.layers.layers[0]);
    expect(command.hasDiff()).toBe(true);

    command.forward();
    expect(projectStore.layers.layers[0].opacity).toBe(0.5);

    command.backward();
    expect(projectStore.layers.layers[0].opacity).toBe(1);
  });

  it('updates frasco only for propNamesToUpdate', () => {
    const layer = projectStore.layers.layers[0];
    const updateSpy = vi.mocked(updateFrascoCanvas);
    updateSpy.mockClear();

    const nameOnly = new LayerPropsCommand({
      layerId: layer.id,
      oldLayerProps: { ...layer, name: 'base' },
      newLayerProps: { ...layer, name: 'renamed' },
    });
    nameOnly.forward();
    expect(projectStore.layers.layers[0].name).toBe('renamed');
    expect(updateSpy).not.toHaveBeenCalled();

    const opacityChange = new LayerPropsCommand({
      layerId: layer.id,
      oldLayerProps: { ...layer, name: 'renamed' },
      newLayerProps: { ...layer, name: 'renamed', opacity: 0.25 },
    });
    opacityChange.forward();
    expect(projectStore.layers.layers[0].opacity).toBe(0.25);
    expect(updateSpy).toHaveBeenCalledWith('Layer props changed');
  });
});
