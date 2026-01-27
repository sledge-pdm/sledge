import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adjustZoomToFit } from '~/features/canvas';
import { CanvasSizeCommand } from '~/features/history/command/canvas/CanvasSizeCommand';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { updateWebGLCanvas } from '~/webgl/service';

vi.mock('~/features/canvas', () => ({
  adjustZoomToFit: vi.fn(),
}));

vi.mock('~/features/selection/SelectionAreaManager', () => ({
  selectionManager: {
    resizeSelectionMask: vi.fn(),
  },
}));

vi.mock('~/webgl/service', () => ({
  updateLayerPreview: vi.fn(),
  updateWebGLCanvas: vi.fn(),
}));

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
    getLayerOptional: vi.fn(() => undefined),
    registerLayer: vi.fn(),
  },
}));

describe('CanvasSizeCommand', () => {
  beforeEach(() => {
    setProjectStore('canvas', 'size', { width: 1, height: 1 });
  });

  it('applies snapshot-based resize forward/backward', () => {
    const beforeSnapshots = [{ layer: { id: 'layer-1' }, image: { packedBuffer: new Uint8Array([1]), width: 1, height: 1 } }];
    const afterSnapshots = [{ layer: { id: 'layer-1' }, image: { packedBuffer: new Uint8Array([2]), width: 2, height: 2 } }];

    const command = new CanvasSizeCommand({
      beforeSize: { width: 1, height: 1 },
      afterSize: { width: 2, height: 2 },
      beforeSnapshots,
      afterSnapshots,
      historyMode: 'snapshot',
    });

    command.forward();
    expect(projectStore.canvas.size).toEqual({ width: 2, height: 2 });

    command.backward();
    expect(projectStore.canvas.size).toEqual({ width: 1, height: 1 });

    expect((layerManager.registerLayer as any).mock.calls.length).toBeGreaterThan(0);
    expect((selectionManager.resizeSelectionMask as any).mock.calls.length).toBeGreaterThan(0);
    expect((adjustZoomToFit as any).mock.calls.length).toBeGreaterThan(0);
    expect((updateWebGLCanvas as any).mock.calls.length).toBeGreaterThan(0);
  });
});
