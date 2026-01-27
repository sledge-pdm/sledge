import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerPropsCommand } from '~/features/history/command/layer/LayerPropsCommand';
import { projectStore } from '~/stores/RuntimeProjectStore';
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

describe('LayerPropsCommand', () => {
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
