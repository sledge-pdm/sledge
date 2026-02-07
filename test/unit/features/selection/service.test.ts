import { LayerType } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as historyModule from '~/features/history';
import * as snippetModule from '~/features/history/command/snippet/ConvertSelectionToImageCommands';
import * as imagePoolFeature from '~/features/image_pool';
import * as layerManagerModule from '~/features/layer/frasco/LayerManager';
import * as logService from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import * as selectionService from '~/features/selection/service';
import { setToolStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import * as textureUtils from '~/utils/TextureUtils';
import * as webglService from '~/webgl/service';

describe('selection service', () => {
  beforeEach(() => {
    selectionManager.clearAll();
    setToolStore('selectionLimitMode', 'inside');
    setProjectStore('canvas', 'size', { width: 4, height: 3 });
    setProjectStore('layers', 'layers', [
      {
        id: 'layer-1',
        name: 'Layer 1',
        type: LayerType.Dot,
        enabled: true,
        opacity: 1,
        mode: BlendMode.normal,
        cutFreeze: false,
      },
    ]);
    setProjectStore('layers', 'state', 'activeLayerId', 'layer-1');
    setProjectStore('layers', 'state', 'selectionEnabled', false);
    setProjectStore('layers', 'state', 'selected', new Set<string>());
    setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
    setProjectStore('imagePool', 'entries', []);
    setProjectStore('imagePool', 'state', 'selectedEntryId', undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('computeMaskBBox returns undefined when mask has no selected pixels', () => {
    const mask = new Uint8Array(12);
    expect(selectionService.computeMaskBBox(mask, 4, 3)).toBeUndefined();
  });

  it('computeMaskBBox returns tight bounding box for selected region', () => {
    const width = 5;
    const height = 4;
    const mask = new Uint8Array(width * height);
    mask[1 * width + 2] = 1;
    mask[2 * width + 4] = 1;
    mask[3 * width + 3] = 1;

    expect(selectionService.computeMaskBBox(mask, width, height)).toEqual({
      x: 2,
      y: 1,
      width: 3,
      height: 3,
    });
  });

  it('isDrawingAllowed allows drawing when mode is none and no state check', () => {
    setToolStore('selectionLimitMode', 'none');
    expect(selectionService.isDrawingAllowed({ x: 100, y: 100 }, true)).toBe(true);
  });

  it('isDrawingAllowed respects inside/outside mode when selection exists', () => {
    const selection = new SelectionMask(4, 4);
    selection.setFlag({ x: 1, y: 1 }, 1);
    selectionManager.setBack(selection);

    setToolStore('selectionLimitMode', 'inside');
    expect(selectionService.isDrawingAllowed({ x: 1, y: 1 })).toBe(true);
    expect(selectionService.isDrawingAllowed({ x: 0, y: 0 })).toBe(false);

    setToolStore('selectionLimitMode', 'outside');
    expect(selectionService.isDrawingAllowed({ x: 1, y: 1 })).toBe(false);
    expect(selectionService.isDrawingAllowed({ x: 0, y: 0 })).toBe(true);
  });

  it('deleteSelectedArea clears selected pixels via mask effect and returns current canvas buffer', () => {
    setProjectStore('canvas', 'size', { width: 3, height: 3 });
    const selection = new SelectionMask(3, 3);
    selection.setFlag({ x: 1, y: 1 }, 1);
    selectionManager.setBack(selection);

    const gl = {} as WebGL2RenderingContext;
    const layer = {
      commitHistory: vi.fn(),
      applyEffectWithTextures: vi.fn(),
      getGLContext: vi.fn(() => gl),
    } as any;
    const exported = new Uint8ClampedArray(3 * 3 * 4).fill(1);
    const texture = {} as WebGLTexture;

    vi.spyOn(layerManagerModule.layerManager, 'getLayerOptional').mockReturnValue(layer);
    vi.spyOn(layerManagerModule.layerManager, 'exportRawCanvas').mockReturnValue(exported);
    vi.spyOn(textureUtils, 'createTexture').mockReturnValue(texture);
    vi.spyOn(textureUtils, 'deleteTexture').mockImplementation(() => {});
    vi.spyOn(webglService, 'updateFrascoCanvas').mockImplementation(() => {});

    const result = selectionService.deleteSelectedArea({ layerId: 'layer-1', noAction: true });

    expect(result).toBe(exported);
    expect(layer.commitHistory).toHaveBeenCalledWith({ x: 1, y: 1, width: 1, height: 1 }, { silent: true });
    expect(layer.applyEffectWithTextures).toHaveBeenCalledTimes(1);
  });

  it('deleteSelectedArea warns and no-ops when selection has no active pixels', () => {
    const warn = vi.spyOn(logService, 'logUserWarn').mockImplementation(() => {});
    selectionManager.setBack(new SelectionMask(3, 3));

    const result = selectionService.deleteSelectedArea({ layerId: 'layer-1' });

    expect(result).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('No selection to delete.');
  });

  it('invertSelectionArea inverts selected mask and commits offset before inversion', () => {
    const info = vi.spyOn(logService, 'logUserInfo').mockImplementation(() => {});
    const mask = new SelectionMask(3, 1);
    mask.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(mask);
    selectionManager.setOffset({ x: 1, y: 0 });

    selectionService.invertSelectionArea();

    const inverted = selectionManager.getBack()!;
    expect(inverted.get({ x: 0, y: 0 })).toBe(1);
    expect(inverted.get({ x: 1, y: 0 })).toBe(0);
    expect(inverted.get({ x: 2, y: 0 })).toBe(1);
    expect(info).toHaveBeenCalledWith('Selection inverted.');
  });

  it('invertSelectionArea warns when there is no selection', () => {
    const warn = vi.spyOn(logService, 'logUserWarn').mockImplementation(() => {});
    selectionManager.clearAll();

    selectionService.invertSelectionArea();

    expect(warn).toHaveBeenCalledWith('No selection to invert.');
  });

  it('getCurrentSelectionBuffer returns trimmed patch and bbox of selected pixels', () => {
    setProjectStore('canvas', 'size', { width: 4, height: 3 });
    const mask = new SelectionMask(4, 3);
    mask.setFlag({ x: 1, y: 0 }, 1);
    mask.setFlag({ x: 2, y: 1 }, 1);
    selectionManager.setBack(mask);

    const src = new Uint8ClampedArray(4 * 3 * 4);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        const idx = (y * 4 + x) * 4;
        src[idx] = x;
        src[idx + 1] = y;
        src[idx + 2] = 100;
        src[idx + 3] = 255;
      }
    }
    vi.spyOn(layerManagerModule.layerManager, 'exportRawCanvas').mockReturnValue(src);

    const result = selectionService.getCurrentSelectionBuffer();

    expect(result?.bbox).toEqual({ x: 1, y: 0, width: 2, height: 2 });
    expect(result?.buffer).toEqual(new Uint8ClampedArray([1, 0, 100, 255, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 100, 255]));
  });

  it('getCurrentSelectionBuffer returns undefined when no selection exists', () => {
    selectionManager.clearAll();
    expect(selectionService.getCurrentSelectionBuffer()).toBeUndefined();
  });

  it('convertSelectionToImage creates image-pool entry and registers history snippet', async () => {
    setProjectStore('canvas', 'size', { width: 3, height: 3 });
    const mask = new SelectionMask(3, 3);
    mask.setFlag({ x: 1, y: 1 }, 1);
    selectionManager.setBack(mask);

    const src = new Uint8ClampedArray(3 * 3 * 4).fill(20);
    vi.spyOn(layerManagerModule.layerManager, 'exportRawCanvas').mockReturnValue(src);

    const entry = {
      id: 'entry-1',
      descriptionName: '',
      base: { width: 1, height: 1 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    } as any;
    const image = { mimeType: 'image/png', deflatedBuffer: new Uint8Array([1]) } as any;

    vi.spyOn(imagePoolFeature, 'createEntryFromRawBuffer').mockResolvedValue({ entry, image } as any);
    const insert = vi.spyOn(imagePoolFeature, 'insertEntry').mockImplementation((inEntry: any) => {
      setProjectStore('imagePool', 'entries', [inEntry]);
    });
    const select = vi.spyOn(imagePoolFeature, 'selectEntry').mockImplementation(() => {});
    const snippet = vi
      .spyOn(snippetModule, 'convertSelectionToImageSnippet')
      .mockReturnValue({ commands: [], context: { icon: '/x', description: 'convert selection' } } as any);
    const addEntry = vi.spyOn(historyModule.historyManager, 'addEntry').mockImplementation(() => {});

    await selectionService.convertSelectionToImage(false);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('entry-1');
    expect(snippet).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ id: 'entry-1' }),
        index: 0,
        deleteAfter: false,
      })
    );
    expect(addEntry).toHaveBeenCalledTimes(1);
    expect(selectionManager.getSelection()).toBeUndefined();
  });

  it('convertSelectionToImage with deleteAfter clears selected area before history registration', async () => {
    setProjectStore('canvas', 'size', { width: 3, height: 3 });
    const mask = new SelectionMask(3, 3);
    mask.setFlag({ x: 1, y: 1 }, 1);
    selectionManager.setBack(mask);

    const src = new Uint8ClampedArray(3 * 3 * 4).fill(20);
    vi.spyOn(layerManagerModule.layerManager, 'exportRawCanvas').mockReturnValue(src);

    const gl = {} as WebGL2RenderingContext;
    const layer = {
      commitHistory: vi.fn(),
      applyEffectWithTextures: vi.fn(),
      getGLContext: vi.fn(() => gl),
    } as any;
    vi.spyOn(layerManagerModule.layerManager, 'getLayerOptional').mockReturnValue(layer);
    vi.spyOn(textureUtils, 'createTexture').mockReturnValue({} as WebGLTexture);
    vi.spyOn(textureUtils, 'deleteTexture').mockImplementation(() => {});
    vi.spyOn(webglService, 'updateFrascoCanvas').mockImplementation(() => {});

    const entry = {
      id: 'entry-2',
      descriptionName: '',
      base: { width: 1, height: 1 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    } as any;
    const image = { mimeType: 'image/png', deflatedBuffer: new Uint8Array([1]) } as any;

    vi.spyOn(imagePoolFeature, 'createEntryFromRawBuffer').mockResolvedValue({ entry, image } as any);
    vi.spyOn(imagePoolFeature, 'insertEntry').mockImplementation((inEntry: any) => {
      setProjectStore('imagePool', 'entries', [inEntry]);
    });
    vi.spyOn(imagePoolFeature, 'selectEntry').mockImplementation(() => {});
    const snippet = vi
      .spyOn(snippetModule, 'convertSelectionToImageSnippet')
      .mockReturnValue({ commands: [], context: { icon: '/x', description: 'convert selection' } } as any);
    vi.spyOn(historyModule.historyManager, 'addEntry').mockImplementation(() => {});

    await selectionService.convertSelectionToImage(true);

    expect(layer.commitHistory).toHaveBeenCalledTimes(1);
    expect(layer.applyEffectWithTextures).toHaveBeenCalledTimes(1);
    expect(snippet).toHaveBeenCalledWith(expect.objectContaining({ deleteAfter: true }));
  });

  it('convertSelectionToImage no-ops when there is no selection buffer', async () => {
    selectionManager.clearAll();
    const createEntry = vi.spyOn(imagePoolFeature, 'createEntryFromRawBuffer');

    await selectionService.convertSelectionToImage(false);

    expect(createEntry).not.toHaveBeenCalled();
  });
});
