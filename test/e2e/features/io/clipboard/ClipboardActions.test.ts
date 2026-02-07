import { beforeEach, describe, expect, it, vi } from 'vitest';
import { historyManager } from '~/features/history';
import { clipboardCopy, clipboardCut, clipboardPaste } from '~/features/io/clipboard/ClipboardActions';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { setInteractStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const WIDTH = 2;
const HEIGHT = 2;

const TARGET_LAYER_ID = 'layer-target';
const SOURCE_LAYER_ID = 'layer-src';

const targetPixels = new Uint8ClampedArray([1, 2, 3, 255, 11, 12, 13, 255, 21, 22, 23, 255, 31, 32, 33, 255]);

const sourcePixels = new Uint8ClampedArray([101, 102, 103, 255, 111, 112, 113, 255, 121, 122, 123, 255, 131, 132, 133, 255]);

const createMask = (points: Array<{ x: number; y: number }>) => {
  const mask = new Uint8Array(WIDTH * HEIGHT);
  points.forEach((point) => {
    mask[point.y * WIDTH + point.x] = 1;
  });
  return new SelectionMask(WIDTH, HEIGHT, mask);
};

const toArray = (buffer: ArrayLike<number>) => Array.from(buffer);

describe('io/clipboard/ClipboardActions (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);

    document.body.innerHTML = '';
    setupWebGL();

    historyManager.clearHistory();
    selectionManager.clearAll();
    setInteractStore('placementPosition', { x: 0, y: 0 });

    const target = buildLayer(TARGET_LAYER_ID, 'target');
    const source = buildLayer(SOURCE_LAYER_ID, 'source');
    resetStore([target, source], { width: WIDTH, height: HEIGHT });
    registerLayers([target], WIDTH, HEIGHT, targetPixels);
    registerLayers([source], WIDTH, HEIGHT, sourcePixels);

    setProjectStore('layers', 'state', 'activeLayerId', TARGET_LAYER_ID);
    setProjectStore('imagePool', 'entries', []);
    setProjectStore('imagePool', 'state', 'selectedEntryId', undefined);
  });

  it('clipboardCopy copies selected pixels as image and stores placement position', async () => {
    selectionManager.setBack(createMask([{ x: 1, y: 0 }]));

    const writeImageSpy = vi.spyOn(platform.clipboard, 'writeImage');
    const createImageMock = vi.fn((_: Uint8Array, __: number, ___: number) =>
      Promise.resolve({
        rgba: async () => new Uint8Array(),
        size: async () => ({ width: 1, height: 1 }),
        close: () => {},
      })
    );
    platform.image.create = createImageMock as any;

    const mode = await clipboardCopy();

    expect(mode).toBe('selection');
    expect(writeImageSpy).toHaveBeenCalledTimes(1);
    expect(createImageMock).toHaveBeenCalledTimes(1);

    const [bufferArg, widthArg, heightArg] = createImageMock.mock.calls[0] as [Uint8Array, number, number];
    expect(widthArg).toBe(1);
    expect(heightArg).toBe(1);
    expect(toArray(bufferArg)).toEqual([11, 12, 13, 255]);
    expect(projectStore.imagePool.entries).toHaveLength(0);
    expect(projectStore.layers.layers).toHaveLength(2);
  });

  it('clipboardCopy copies active layer id as text when no selection exists', async () => {
    const writeTextSpy = vi.spyOn(platform.clipboard, 'writeText');

    const mode = await clipboardCopy();

    expect(mode).toBe('layer');
    expect(writeTextSpy).toHaveBeenCalledWith(TARGET_LAYER_ID);
  });

  it('clipboardCut marks active layer as cutFreeze when no selection exists', async () => {
    await clipboardCut();

    const layer = projectStore.layers.layers.find((item) => item.id === TARGET_LAYER_ID);
    expect(layer?.cutFreeze).toBe(true);
  });

  it('clipboardCut clears selected pixels on active layer', async () => {
    selectionManager.setBack(createMask([{ x: 0, y: 1 }]));

    const before = layerManager.readPixelCanvas(TARGET_LAYER_ID, 0, 1);
    expect(before).toEqual([21, 22, 23, 255]);

    await clipboardCut();

    const after = layerManager.readPixelCanvas(TARGET_LAYER_ID, 0, 1);
    expect(after).toEqual([0, 0, 0, 0]);
  });

  it('clipboardPaste duplicates source layer when clipboard contains non-cut layer id', async () => {
    platform.clipboard.readText = vi.fn(async () => SOURCE_LAYER_ID) as any;

    await clipboardPaste();

    expect(projectStore.layers.layers).toHaveLength(3);

    const pastedLayerId = projectStore.layers.state.activeLayerId;
    expect(pastedLayerId).not.toBe(TARGET_LAYER_ID);
    expect(pastedLayerId).not.toBe(SOURCE_LAYER_ID);

    const pastedBuffer = layerManager.exportRawCanvas(pastedLayerId);
    expect(toArray(pastedBuffer)).toEqual(toArray(sourcePixels));
  });

  it('clipboardPaste performs cut-paste flow when source layer is cut-frozen', async () => {
    setProjectStore('layers', 'layers', (layers) => layers.map((layer) => (layer.id === SOURCE_LAYER_ID ? { ...layer, cutFreeze: true } : layer)));
    platform.clipboard.readText = vi.fn(async () => SOURCE_LAYER_ID) as any;

    await clipboardPaste();

    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual([SOURCE_LAYER_ID, TARGET_LAYER_ID]);
    expect(projectStore.layers.layers.find((layer) => layer.id === SOURCE_LAYER_ID)?.cutFreeze).toBe(false);
  });

  it('clipboardPaste inserts clipboard image into image pool and selects it', async () => {
    const close = vi.fn();
    setInteractStore('placementPosition', { x: 5, y: 6 });
    platform.clipboard.readText = vi.fn(async () => '') as any;
    platform.clipboard.readImage = vi.fn(async () => ({
      rgba: async () => new Uint8Array([200, 10, 20, 255]),
      size: async () => ({ width: 1, height: 1 }),
      close,
    })) as any;

    await clipboardPaste();

    expect(close).toHaveBeenCalledTimes(1);
    expect(projectStore.imagePool.entries).toHaveLength(1);

    const entry = projectStore.imagePool.entries[0];
    expect(entry?.descriptionName).toBe('[ from clipboard ]');
    expect(entry?.transform.x).toBe(5);
    expect(entry?.transform.y).toBe(6);
    expect(projectStore.imagePool.state.selectedEntryId).toBe(entry?.id);
  });
});
