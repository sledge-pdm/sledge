import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

const mocks = vi.hoisted(() => ({
  getMaxTextureSize: vi.fn(),
  dialogMessage: vi.fn(),
  clearCache: vi.fn(),
}));

vi.mock('~/webgl/FrascoRenderer', () => ({
  frascoRenderer: {
    getMaxTextureSize: mocks.getMaxTextureSize,
  },
}));

vi.mock('~/utils/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/platform')>();
  return {
    ...actual,
    dialog: {
      ...actual.dialog,
      message: mocks.dialogMessage,
    },
  };
});

vi.mock('~/features/canvas/transform/CanvasPositionCalculator', () => ({
  coordinateTransform: {
    clearCache: mocks.clearCache,
    windowToCanvas: vi.fn((pos: { x: number; y: number }) => ({ x: pos.x, y: pos.y })),
    canvasToWindow: vi.fn((pos: { x: number; y: number }) => ({ x: pos.x, y: pos.y })),
  },
}));

import { adjustZoomToFit, centeringCanvas, isValidCanvasSize, setOffset, setRotation, setZoom } from '~/features/canvas/service';

describe('features/canvas/service behavior', () => {
  const originalDocument = (globalThis as any).document;
  let elements: Record<string, any>;

  beforeEach(() => {
    mocks.getMaxTextureSize.mockReset();
    mocks.dialogMessage.mockReset();
    mocks.clearCache.mockReset();
    mocks.getMaxTextureSize.mockReturnValue(undefined);

    setProjectStore('canvas', 'size', { width: 100, height: 50 });
    setInteractStore({
      ...defaultInteractStore,
      zoom: 1,
      initialZoom: 1,
      offset: { x: 0, y: 0 },
      offsetOrigin: { x: 0, y: 0 },
      rotation: 10,
      isCanvasSizeFrameMode: true,
      canvasSizeFrameOffset: { x: 5, y: 6 },
      canvasSizeFrameSize: { width: 7, height: 8 },
    });

    elements = {};
    (globalThis as any).document = {
      getElementById: (id: string) => elements[id] ?? null,
    };
  });

  afterAll(() => {
    (globalThis as any).document = originalDocument;
  });

  it('isValidCanvasSize rejects buffers beyond WebGL safety limit and shows warning', () => {
    mocks.getMaxTextureSize.mockReturnValue(1000);

    const ok = isValidCanvasSize({ width: 400, height: 400 });

    expect(ok).toBe(false);
    expect(mocks.dialogMessage).toHaveBeenCalledTimes(1);
  });

  it('isValidCanvasSize accepts in-range values when WebGL limit is not available', () => {
    const ok = isValidCanvasSize({ width: 400, height: 400 });

    expect(ok).toBe(true);
    expect(mocks.dialogMessage).not.toHaveBeenCalled();
  });

  it('setZoom/setOffset/setRotation clear cache only when actual value changes', () => {
    expect(setZoom(1)).toBe(false);
    expect(setZoom(2)).toBe(true);
    expect(setZoom(2)).toBe(false);
    setOffset({ x: 0, y: 0 });
    setOffset({ x: 1, y: 2 });
    setRotation(181);
    setRotation(181);

    expect(mocks.clearCache).toHaveBeenCalledTimes(3);
    expect(interactStore.zoom).toBe(2);
    expect(interactStore.offset).toEqual({ x: 1, y: 2 });
    expect(interactStore.rotation).toBe(-179);
  });

  it('adjustZoomToFit + centeringCanvas update zoom/origin/offset from layout elements', () => {
    elements['sections-between-area'] = {
      getBoundingClientRect: () => ({ x: 10, y: 20, width: 500, height: 400 }),
    };
    elements['side-section-control-leftSide'] = { scrollWidth: 40 };
    elements['bottom-bar'] = { scrollHeight: 12 };

    adjustZoomToFit(100, 50);

    expect(interactStore.initialZoom).toBeCloseTo(3.4, 6);
    expect(interactStore.zoom).toBeCloseTo(3.4, 6);
    expect(interactStore.offset).toEqual({ x: -40, y: 12 });
    expect(interactStore.offsetOrigin.x).toBeCloseTo(90, 6);
    expect(interactStore.offsetOrigin.y).toBeCloseTo(115, 6);
    expect(interactStore.rotation).toBe(0);
  });

  it('centeringCanvas is no-op when target area is missing', () => {
    const before = {
      offset: { ...interactStore.offset },
      offsetOrigin: { ...interactStore.offsetOrigin },
      rotation: interactStore.rotation,
    };

    centeringCanvas();

    expect(interactStore.offset).toEqual(before.offset);
    expect(interactStore.offsetOrigin).toEqual(before.offsetOrigin);
    expect(interactStore.rotation).toBe(before.rotation);
  });

  it('adjustZoomToFit returns early when width or height is zero', () => {
    adjustZoomToFit(0, 100);
    adjustZoomToFit(100, 0);

    expect(interactStore.initialZoom).toBe(1);
    expect(interactStore.zoom).toBe(1);
  });
});
