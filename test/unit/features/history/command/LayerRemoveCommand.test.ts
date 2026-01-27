import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerRemoveCommand } from '~/features/history/command/LayerRemoveCommand';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from './helpers';

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

describe('LayerRemoveCommand', () => {
  beforeEach(() => {
    resetStore([buildLayer('base')]);
  });

  it('removes and restores layers (with preserveActive)', () => {
    const extra = buildLayer('layer-2');
    resetStore([buildLayer('base'), extra]);
    setProjectStore('layers', 'state', 'activeLayerId', 'base');

    const command = new LayerRemoveCommand({ layerId: extra.id, preserveActive: true });
    command.forward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['base']);
    expect(projectStore.layers.state.activeLayerId).toBe('base');

    command.backward();
    expect(projectStore.layers.layers.map((l) => l.id)).toEqual(['base', 'layer-2']);
  });
});
