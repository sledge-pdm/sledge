import { LayerType } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it } from 'vitest';
import { changeCanvasSize } from '~/features/canvas/actions';
import { resizeBufferWithOrigins } from '~/features/canvas/service';
import { historyManager } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const makeLayer = (id: string) => ({
  id,
  name: id,
  type: LayerType.Dot,
  enabled: true,
  opacity: 1,
  mode: BlendMode.normal,
  cutFreeze: false,
});

const makeBuffer = (width: number, height: number, seed: number) => {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    out[idx] = seed + i;
    out[idx + 1] = seed + i + 1;
    out[idx + 2] = seed + i + 2;
    out[idx + 3] = 255;
  }
  return out;
};

describe('features/canvas/actions', () => {
  beforeEach(() => {
    for (const layer of projectStore.layers.layers) {
      layerManager.removeLayer(layer.id);
    }

    const layers = [makeLayer('l1'), makeLayer('l2')];
    setProjectStore('canvas', 'size', { width: 8, height: 8 });
    setProjectStore('layers', 'layers', layers as any);
    setProjectStore('layers', 'state', 'activeLayerId', 'l1');

    layerManager.registerLayer('l1', makeBuffer(8, 8, 10), 8, 8, { inputSpace: 'canvas' });
    layerManager.registerLayer('l2', makeBuffer(8, 8, 60), 8, 8, { inputSpace: 'canvas' });

    selectionManager.clearAll();
    historyManager.clearHistory();

    setInteractStore({
      ...defaultInteractStore,
      isCanvasSizeFrameMode: true,
      canvasSizeFrameOffset: { x: 2, y: 3 },
      canvasSizeFrameSize: { width: 4, height: 5 },
    });
  });

  it('returns false when size is invalid', () => {
    const ok = changeCanvasSize({ width: 0, height: 16 }, {});

    expect(ok).toBe(false);
    expect(projectStore.canvas.size).toEqual({ width: 8, height: 8 });
  });

  it('returns false when size/origin are effectively unchanged', () => {
    const ok = changeCanvasSize({ width: 8, height: 8 }, {});

    expect(ok).toBe(false);
  });

  it('resizes buffers and registers history by default', () => {
    const oldL2 = layerManager.exportRawCanvas('l2');

    const ok = changeCanvasSize(
      { width: 10, height: 9 },
      {
        srcOrigin: { x: 1, y: 2 },
        destOrigin: { x: 3, y: 4 },
      }
    );

    expect(ok).toBe(true);
    expect(projectStore.canvas.size).toEqual({ width: 10, height: 9 });

    const expectedL2 = resizeBufferWithOrigins(oldL2, { width: 8, height: 8 }, { width: 10, height: 9 }, { x: 1, y: 2 }, { x: 3, y: 4 });
    const actualL2 = layerManager.exportRawCanvas('l2');
    expect(Array.from(actualL2)).toEqual(Array.from(expectedL2));

    expect(historyManager.canUndo()).toBe(true);
    expect(interactStore.isCanvasSizeFrameMode).toBe(false);
    expect(interactStore.canvasSizeFrameOffset).toEqual({ x: 0, y: 0 });
    expect(interactStore.canvasSizeFrameSize).toEqual({ width: 0, height: 0 });
  });

  it('skips history registration when register is false', () => {
    const ok = changeCanvasSize({ width: 10, height: 9 }, { register: false });

    expect(ok).toBe(true);
    expect(historyManager.canUndo()).toBe(false);
  });
});
