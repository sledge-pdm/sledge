import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerMergeCommand } from '~/features/history/command/layer/LayerMergeCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { buildLayer, resetStore } from '../helpers';

vi.mock('~/features/history/actions/utils', () => ({
  inflateLayerSnapshot: vi.fn((snapshot: any) => ({
    layer: snapshot.layer,
    image: {
      buffer: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    },
  })),
}));

vi.mock('~/features/layer/frasco/LayerManager', () => ({
  layerManager: {
    getLayerOptional: vi.fn(() => ({
      readPixels: () => new Uint8Array([1, 2, 3, 4]),
      getWidth: () => 1,
      getHeight: () => 1,
      writePixels: vi.fn(),
    })),
  },
}));

vi.mock('~/webgl/service', () => ({
  updateLayerPreview: vi.fn(),
  updateWebGLCanvas: vi.fn(),
}));

describe('LayerMergeCommand', () => {
  beforeEach(() => {
    resetStore([buildLayer('layer-a'), buildLayer('layer-b')]);
    setProjectStore('layers', 'state', 'activeLayerId', 'layer-b');
  });

  it('swaps snapshots and active layer on undo/redo', () => {
    const originSnapshot = { layer: { ...projectStore.layers.layers[0] }, image: { packedBuffer: new Uint8Array([1]), width: 1, height: 1 } };
    const targetSnapshot = { layer: { ...projectStore.layers.layers[1] }, image: { packedBuffer: new Uint8Array([2]), width: 1, height: 1 } };

    const command = new LayerMergeCommand({
      originIndex: 0,
      targetIndex: 1,
      activeLayerId: 'layer-a',
      originPackedSnapshot: originSnapshot as any,
      targetPackedSnapshot: targetSnapshot as any,
    });

    command.forward();
    expect(projectStore.layers.state.activeLayerId).toBe('layer-a');

    command.backward();
    expect(projectStore.layers.state.activeLayerId).toBe('layer-b');
    expect((layerManager.getLayerOptional as any).mock.calls.length).toBeGreaterThan(0);
  });
});
