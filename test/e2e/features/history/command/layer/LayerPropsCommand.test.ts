import { beforeEach, describe, expect, it } from 'vitest';
import { LayerPropsCommand } from '~/features/history/command/layer/LayerPropsCommand';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from '../helpers';

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
});
