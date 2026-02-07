import { beforeEach, describe, expect, it, vi } from 'vitest';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

const mocks = vi.hoisted(() => ({
  exportRawCanvas: vi.fn(),
  getLayerOptional: vi.fn(),
  replaceLayerBuffer: vi.fn(),
  updateFrascoCanvas: vi.fn(),
  logSystemError: vi.fn(),
}));

vi.mock('~/features/layer/frasco/LayerManager', () => ({
  layerManager: {
    exportRawCanvas: mocks.exportRawCanvas,
    getLayerOptional: mocks.getLayerOptional,
    replaceLayerBuffer: mocks.replaceLayerBuffer,
  },
}));

vi.mock('~/webgl/service', () => ({
  updateFrascoCanvas: mocks.updateFrascoCanvas,
}));

vi.mock('~/features/log/service', () => ({
  logSystemError: mocks.logSystemError,
  logSystemInfo: vi.fn(),
}));

import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';

const pixelAt = (buffer: Uint8ClampedArray, width: number, x: number, y: number) => {
  const idx = (y * width + x) * 4;
  return [buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]];
};

const makeBuffer = (width: number, height: number, color: [number, number, number, number]) => {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    out[idx] = color[0];
    out[idx + 1] = color[1];
    out[idx + 2] = color[2];
    out[idx + 3] = color[3];
  }
  return out;
};

describe('features/selection/FloatingMoveManager', () => {
  beforeEach(() => {
    setProjectStore('canvas', 'size', { width: 3, height: 3 });
    selectionManager.clearAll();
    floatingMoveManager.cancel();

    mocks.exportRawCanvas.mockReset();
    mocks.getLayerOptional.mockReset();
    mocks.replaceLayerBuffer.mockReset();
    mocks.updateFrascoCanvas.mockReset();
    mocks.logSystemError.mockReset();

    mocks.exportRawCanvas.mockReturnValue(makeBuffer(3, 3, [10, 20, 30, 255]));
  });

  it('startMove(selection) clears selected area from preview buffer', async () => {
    const mask = new SelectionMask(3, 3);
    mask.setFlag({ x: 1, y: 1 }, 1);

    await floatingMoveManager.startMove(
      {
        buffer: makeBuffer(1, 1, [255, 0, 0, 255]),
        width: 1,
        height: 1,
        offset: { x: 0, y: 0 },
        origin: { x: 1, y: 1 },
      },
      'selection',
      'layer-1',
      mask
    );

    expect(floatingMoveManager.isMoving()).toBe(true);
    expect(floatingMoveManager.getState()).toBe('selection');
    expect(pixelAt(floatingMoveManager.getPreviewBuffer()!, 3, 1, 1)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(floatingMoveManager.getPreviewBuffer()!, 3, 0, 0)).toEqual([10, 20, 30, 255]);
    expect(mocks.updateFrascoCanvas).toHaveBeenCalledWith('floating-move');
  });

  it('moveDelta and moveTo update floating offset', async () => {
    await floatingMoveManager.startMove(
      {
        buffer: makeBuffer(1, 1, [255, 0, 0, 255]),
        width: 1,
        height: 1,
        offset: { x: 1, y: 1 },
      },
      'pasted',
      'layer-1'
    );

    await floatingMoveManager.moveDelta({ x: 2, y: -1 });
    expect(floatingMoveManager.getOffset()).toEqual({ x: 3, y: 0 });

    await floatingMoveManager.moveTo({ x: -2, y: 4 });
    expect(floatingMoveManager.getOffset()).toEqual({ x: -2, y: 4 });
  });

  it('composes floating buffer onto preview with current offset', async () => {
    const floating = new Uint8ClampedArray([200, 100, 50, 255]);
    await floatingMoveManager.startMove(
      {
        buffer: floating,
        width: 1,
        height: 1,
        origin: { x: 0, y: 0 },
        offset: { x: 1, y: 2 },
      },
      'pasted',
      'layer-1'
    );

    const composed = floatingMoveManager.getCompositePreview()!;
    expect(pixelAt(composed, 3, 1, 2)).toEqual([200, 100, 50, 255]);
    expect(pixelAt(composed, 3, 0, 0)).toEqual([10, 20, 30, 255]);
  });

  it('commit(selection) replaces layer buffer and shifts selection mask', async () => {
    const layer = { commitHistory: vi.fn() };
    mocks.getLayerOptional.mockReturnValue(layer);

    const selection = new SelectionMask(3, 3);
    selection.setFlag({ x: 0, y: 0 }, 1);
    selectionManager.setBack(selection);

    await floatingMoveManager.startMove(
      {
        buffer: makeBuffer(1, 1, [255, 0, 0, 255]),
        width: 1,
        height: 1,
        offset: { x: 1, y: 1 },
        origin: { x: 0, y: 0 },
      },
      'selection',
      'layer-1',
      selection
    );

    floatingMoveManager.commit();

    expect(layer.commitHistory).toHaveBeenCalledTimes(1);
    expect(mocks.replaceLayerBuffer).toHaveBeenCalledTimes(1);
    expect(mocks.replaceLayerBuffer.mock.calls[0][0]).toBe('layer-1');
    expect(mocks.replaceLayerBuffer.mock.calls[0][3]).toBe(3);
    expect(mocks.replaceLayerBuffer.mock.calls[0][4]).toEqual({ inputSpace: 'canvas' });
    expect(selectionManager.getBack()?.get({ x: 1, y: 1 })).toBe(1);
    expect(selectionManager.getBack()?.get({ x: 0, y: 0 })).toBe(0);
    expect(floatingMoveManager.isMoving()).toBe(false);
  });

  it('commit(pasted) clears selection', async () => {
    const layer = { commitHistory: vi.fn() };
    mocks.getLayerOptional.mockReturnValue(layer);

    const selection = new SelectionMask(3, 3);
    selection.setFlag({ x: 2, y: 2 }, 1);
    selectionManager.setBack(selection);

    await floatingMoveManager.startMove(
      {
        buffer: makeBuffer(1, 1, [255, 0, 0, 255]),
        width: 1,
        height: 1,
        offset: { x: 0, y: 0 },
      },
      'pasted',
      'layer-1'
    );

    floatingMoveManager.commit();

    expect(selectionManager.getSelection()).toBeUndefined();
    expect(floatingMoveManager.isMoving()).toBe(false);
  });

  it('cancel(selection) restores original floating area', async () => {
    const initial = new SelectionMask(3, 3);
    initial.setFlag({ x: 1, y: 0 }, 1);

    await floatingMoveManager.startMove(
      {
        buffer: makeBuffer(1, 1, [255, 255, 255, 255]),
        width: 1,
        height: 1,
        offset: { x: 1, y: 1 },
      },
      'selection',
      'layer-1',
      initial
    );

    selectionManager.clearAll();
    floatingMoveManager.cancel();

    expect(selectionManager.getBack()?.get({ x: 1, y: 0 })).toBe(1);
    expect(selectionManager.getBack()?.get({ x: 2, y: 1 })).toBe(0);
    expect(floatingMoveManager.isMoving()).toBe(false);
  });

  it('logs error when move/commit is called without active move', async () => {
    await floatingMoveManager.moveDelta({ x: 1, y: 1 });
    await floatingMoveManager.moveTo({ x: 3, y: 3 });
    floatingMoveManager.commit();

    expect(mocks.logSystemError).toHaveBeenCalled();
  });
});
