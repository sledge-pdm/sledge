import { beforeEach, describe, expect, it } from 'vitest';
import { SetActiveLayerCommand } from '~/features/history/command/layer_list/SetActiveLayerCommand';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from '../../helpers';

describe('SetActiveLayerCommand (e2e)', () => {
  beforeEach(() => {
    resetStore([buildLayer('base')]);
  });

  it('restores the previous active layer on undo', () => {
    const layers = [buildLayer('a'), buildLayer('b')];
    resetStore(layers);
    setProjectStore('layers', 'state', 'activeLayerId', 'a');

    const command = new SetActiveLayerCommand({ layerId: 'b' });
    command.forward();
    expect(projectStore.layers.state.activeLayerId).toBe('b');

    command.backward();
    expect(projectStore.layers.state.activeLayerId).toBe('a');

    const context = command.getContext();
    expect(context.icon).toBe('/assets/icons/actions/layer.png');
    expect(context.description).toContain('change active layer');
  });

  it('no-ops backward when pastActiveLayerId is missing', () => {
    resetStore([buildLayer('base')]);
    const command = new SetActiveLayerCommand({ layerId: 'base' });
    command.backward();
    expect(projectStore.layers.state.activeLayerId).toBe('base');
  });
});
