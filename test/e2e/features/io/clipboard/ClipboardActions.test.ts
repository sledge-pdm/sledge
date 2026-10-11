import { beforeEach, describe, expect, it, vi } from 'vitest';
import { beginEditSession } from '~/features/edit_session';
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
    const writeTextSpy = vi.spyOn(platform.clipboard, 'writeText');
    await clipboardCut();

    const layer = projectStore.layers.layers.find((item) => item.id === TARGET_LAYER_ID);
    expect(layer?.cutFreeze).toBe(true);
    expect(projectStore.layers.layers.find((item) => item.id === SOURCE_LAYER_ID)?.cutFreeze).toBe(false);
    expect(writeTextSpy).toHaveBeenCalledWith(TARGET_LAYER_ID);
  });

  const selectLayers = (ids: string[]) => {
    setProjectStore('layers', 'state', 'selectionEnabled', true);
    setProjectStore('layers', 'state', 'selected', new Set(ids));
  };

  it('cuts all selected layers in stack order, excluding an unselected active layer', async () => {
    const extra = buildLayer('extra');
    setProjectStore('layers', 'layers', (layers) => [...layers, extra]);
    registerLayers([extra], WIDTH, HEIGHT, sourcePixels);
    selectLayers(['extra', SOURCE_LAYER_ID, 'missing']);
    const writeTextSpy = vi.spyOn(platform.clipboard, 'writeText');

    await clipboardCut();

    expect(JSON.parse((writeTextSpy.mock.calls as unknown as [string][])[0][0])).toEqual({
      type: 'sledge/layers',
      layerIds: [SOURCE_LAYER_ID, 'extra'],
    });
    expect(projectStore.layers.layers.map((layer) => layer.cutFreeze)).toEqual([false, true, true]);
    expect(projectStore.layers.state.activeLayerId).toBe(TARGET_LAYER_ID);
    expect(projectStore.layers.state.selected).toEqual(new Set(['extra', SOURCE_LAYER_ID, 'missing']));
    expect(projectStore.layers.state.selectionEnabled).toBe(true);
    expect(toArray(layerManager.exportRawCanvas(SOURCE_LAYER_ID))).toEqual(toArray(sourcePixels));
  });

  it('cuts a single checked layer instead of the unselected active layer', async () => {
    selectLayers([SOURCE_LAYER_ID]);
    const writeTextSpy = vi.spyOn(platform.clipboard, 'writeText');
    await clipboardCut();
    expect(writeTextSpy).toHaveBeenCalledWith(SOURCE_LAYER_ID);
    expect(projectStore.layers.layers.map((layer) => layer.cutFreeze)).toEqual([false, true]);
  });

  it('ignores stored layer selections when layer selection mode is disabled', async () => {
    setProjectStore('layers', 'state', 'selected', new Set([SOURCE_LAYER_ID]));
    await clipboardCut();
    expect(projectStore.layers.layers.map((layer) => layer.cutFreeze)).toEqual([true, false]);
  });

  it('does not freeze layers when writing the clipboard fails', async () => {
    selectLayers([TARGET_LAYER_ID, SOURCE_LAYER_ID]);
    platform.clipboard.writeText = vi.fn(async () => {
      throw new Error('clipboard unavailable');
    });
    await clipboardCut();
    expect(projectStore.layers.layers.every((layer) => !layer.cutFreeze)).toBe(true);
  });

  it('captures the cut targets before awaiting the clipboard write', async () => {
    selectLayers([TARGET_LAYER_ID, SOURCE_LAYER_ID]);
    platform.clipboard.writeText = vi.fn(async () => {
      setProjectStore('layers', 'state', 'selected', new Set([SOURCE_LAYER_ID]));
    });
    await clipboardCut();
    expect(projectStore.layers.layers.every((layer) => layer.cutFreeze)).toBe(true);
  });

  it('refuses a multi-layer cut while an exclusive edit session is open', async () => {
    selectLayers([TARGET_LAYER_ID, SOURCE_LAYER_ID]);
    const close = beginEditSession({ label: 'selection move', isExclusive: () => true, interrupt: () => {}, finalize: () => {} });
    const writeTextSpy = vi.spyOn(platform.clipboard, 'writeText');
    try {
      await clipboardCut();
      expect(writeTextSpy).not.toHaveBeenCalled();
      expect(projectStore.layers.layers.every((layer) => !layer.cutFreeze)).toBe(true);
    } finally {
      close();
    }
  });

  it('cuts whole layers when multiple layers and a pixel region are selected', async () => {
    selectLayers([TARGET_LAYER_ID, SOURCE_LAYER_ID]);
    selectionManager.setBack(createMask([{ x: 0, y: 1 }]));
    const writeImageSpy = vi.spyOn(platform.clipboard, 'writeImage');
    await clipboardCut();
    expect(writeImageSpy).not.toHaveBeenCalled();
    expect(projectStore.layers.layers.every((layer) => layer.cutFreeze)).toBe(true);
    expect(toArray(layerManager.exportRawCanvas(TARGET_LAYER_ID))).toEqual(toArray(targetPixels));
    expect(selectionManager.hasSelection()).toBe(true);
  });

  it('pastes the entire cut group in order and supports undo, redo, and repeated paste', async () => {
    const extra = buildLayer('extra');
    setProjectStore('layers', 'layers', (layers) => [...layers, extra]);
    registerLayers([extra], WIDTH, HEIGHT, sourcePixels);
    selectLayers(['extra', SOURCE_LAYER_ID]);
    let text = '';
    platform.clipboard.writeText = vi.fn(async (value = '') => {
      text = value;
    });
    platform.clipboard.readText = vi.fn(async () => text);
    await clipboardCut();
    await clipboardPaste();

    const pastedOrder = [SOURCE_LAYER_ID, 'extra', TARGET_LAYER_ID];
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(pastedOrder);
    expect(projectStore.layers.layers.every((layer) => !layer.cutFreeze)).toBe(true);
    expect(toArray(layerManager.exportRawCanvas(SOURCE_LAYER_ID))).toEqual(toArray(sourcePixels));
    expect(historyManager.getUndoStack()).toHaveLength(1);
    historyManager.undo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual([TARGET_LAYER_ID, SOURCE_LAYER_ID, 'extra']);
    historyManager.redo();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual(pastedOrder);

    await clipboardPaste();
    expect(projectStore.layers.layers).toHaveLength(5);
    const copies = projectStore.layers.layers.filter((layer) => !pastedOrder.includes(layer.id));
    expect(copies).toHaveLength(2);
    copies.forEach((layer) => expect(toArray(layerManager.exportRawCanvas(layer.id))).toEqual(toArray(sourcePixels)));
  });

  it('can cut and paste every layer without removing the last remaining layer', async () => {
    selectLayers([SOURCE_LAYER_ID, TARGET_LAYER_ID]);
    let text = '';
    platform.clipboard.writeText = vi.fn(async (value = '') => {
      text = value;
    });
    platform.clipboard.readText = vi.fn(async () => text);
    await clipboardCut();
    await clipboardPaste();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual([TARGET_LAYER_ID, SOURCE_LAYER_ID]);
    expect(projectStore.layers.layers.every((layer) => !layer.cutFreeze)).toBe(true);
    expect(toArray(layerManager.exportRawCanvas(TARGET_LAYER_ID))).toEqual(toArray(targetPixels));
  });

  it('does not partially paste a group with a missing source layer', async () => {
    setProjectStore('layers', 'layers', 1, 'cutFreeze', true);
    platform.clipboard.readText = vi.fn(async () => JSON.stringify({ type: 'sledge/layers', layerIds: [SOURCE_LAYER_ID, 'missing'] }));
    await clipboardPaste();
    expect(projectStore.layers.layers.map((layer) => layer.id)).toEqual([TARGET_LAYER_ID, SOURCE_LAYER_ID]);
    expect(projectStore.layers.layers[1].cutFreeze).toBe(true);
    expect(historyManager.getUndoStack()).toHaveLength(0);
  });

  it('clipboardCut clears selected pixels on active layer', async () => {
    selectionManager.setBack(createMask([{ x: 0, y: 1 }]));

    const before = layerManager.readPixelCanvas(TARGET_LAYER_ID, 0, 1);
    expect(before).toEqual([21, 22, 23, 255]);

    await clipboardCut();

    const after = layerManager.readPixelCanvas(TARGET_LAYER_ID, 0, 1);
    expect(after).toEqual([0, 0, 0, 0]);
    expect(toArray(layerManager.exportRawCanvas(SOURCE_LAYER_ID))).toEqual(toArray(sourcePixels));
    expect(projectStore.layers.layers.every((layer) => !layer.cutFreeze)).toBe(true);
    historyManager.undo();
    expect(layerManager.readPixelCanvas(TARGET_LAYER_ID, 0, 1)).toEqual(before);
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
