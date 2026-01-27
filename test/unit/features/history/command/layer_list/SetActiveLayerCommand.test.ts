import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SetActiveLayerCommand } from '~/features/history/command/layer_list/SetActiveLayerCommand';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from '../helpers';

vi.mock('~/webgl/service', () => ({
  updateWebGLCanvas: vi.fn(),
  updateLayerPreview: vi.fn(),
}));

vi.mock('~/features/history/actions/utils', async () => {
  const { projectStore } = await import('~/stores/RuntimeProjectStore');
  return {
    getPackedLayerSnapshot: (layerId: string) => {
      const layer = projectStore.layers.layers.find((l) => l.id === layerId);
      if (!layer) return undefined;
      return {
        layer: { ...layer },
        image: {
          packedBuffer: new Uint8Array([1, 2, 3, 4]),
          width: 1,
          height: 1,
        },
      };
    },
    inflateLayerSnapshot: (snapshot: any) => {
      if (!snapshot || !snapshot.image) return undefined;
      const width = snapshot.image.width ?? 1;
      const height = snapshot.image.height ?? 1;
      return {
        layer: snapshot.layer,
        image: {
          buffer: new Uint8ClampedArray(width * height * 4),
          width,
          height,
        },
      };
    },
  };
});

describe('SetActiveLayerCommand', () => {
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
  });
});
