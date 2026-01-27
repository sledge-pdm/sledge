import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConvertSelectionCommand } from '~/features/history/command/selection/ConvertSelectionCommand';
import { ImagePoolEntry, ImagePoolImage } from '~/features/image_pool';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

vi.mock('~/features/image_pool/blobManager', () => ({
  clearImagePoolBlobUrls: vi.fn(),
}));

vi.mock('~/features/selection/FloatingMoveManager', () => ({
  floatingMoveManager: {
    isMoving: vi.fn(() => false),
  },
}));

vi.mock('~/features/selection/SelectionOperator', () => ({
  cancelMove: vi.fn(),
}));

vi.mock('~/features/layer/frasco/LayerManager', () => ({
  layerManager: {
    replaceLayerBuffer: vi.fn(),
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

const buildEntry = (id: string): ImagePoolEntry => ({
  id,
  base: { width: 1, height: 1 },
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
  opacity: 1,
  visible: true,
});

const buildImage = (): ImagePoolImage => ({
  mimeType: 'image/png',
  deflatedBuffer: new Uint8Array([1, 2, 3]),
});

describe('ConvertSelectionCommand', () => {
  beforeEach(() => {
    setProjectStore('imagePool', 'entries', []);
    setImagePoolImages(new Map());
  });

  it('switches image pool snapshots and restores layer buffers', () => {
    const oldEntries = [buildEntry('old')];
    const newEntries = [buildEntry('new')];
    const oldImages = new Map<string, ImagePoolImage>([['old', buildImage()]]);
    const newImages = new Map<string, ImagePoolImage>([['new', buildImage()]]);

    setProjectStore('imagePool', 'entries', oldEntries);
    setImagePoolImages(oldImages);

    const command = new ConvertSelectionCommand({
      layerId: 'layer-1',
      oldEntries,
      newEntries,
      oldImages,
      newImages,
      beforeSnapshot: { layer: { id: 'layer-1' } } as any,
      afterSnapshot: { layer: { id: 'layer-1' } } as any,
    });

    command.forward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['new']);
    expect(imagePoolImages().get('new')).toEqual(newImages.get('new'));

    command.backward();
    expect(projectStore.imagePool.entries.map((e) => e.id)).toEqual(['old']);
    expect(imagePoolImages().get('old')).toEqual(oldImages.get('old'));
    expect((layerManager.replaceLayerBuffer as any).mock.calls.length).toBe(2);
    expect(command.getContext().description).toContain('cut');
  });
});
