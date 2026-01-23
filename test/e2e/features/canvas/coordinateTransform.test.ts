import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { coordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { setInteractStore } from '~/stores/EditorStores';
import { defaultInteractStore, InteractStore } from '~/stores/editor/InteractStore';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

const buildInteract = (partial: Partial<InteractStore> = {}): InteractStore => ({
  ...defaultInteractStore,
  ...partial,
  lastPointerWindow: { ...defaultInteractStore.lastPointerWindow, ...partial.lastPointerWindow },
  lastPointerOnCanvas: { ...defaultInteractStore.lastPointerOnCanvas, ...partial.lastPointerOnCanvas },
  placementPosition: { ...defaultInteractStore.placementPosition, ...partial.placementPosition },
  offsetOrigin: { ...defaultInteractStore.offsetOrigin, ...partial.offsetOrigin },
  offset: { ...defaultInteractStore.offset, ...partial.offset },
  canvasSizeFrameOffset: { ...defaultInteractStore.canvasSizeFrameOffset, ...partial.canvasSizeFrameOffset },
  canvasSizeFrameSize: { ...defaultInteractStore.canvasSizeFrameSize, ...partial.canvasSizeFrameSize },
});

const createCanvasArea = (rect: { left: number; top: number; width: number; height: number }) => {
  const el = document.createElement('div');
  el.id = 'canvas-area';
  el.style.position = 'absolute';
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  el.getBoundingClientRect = () => new DOMRect(rect.left, rect.top, rect.width, rect.height);
  document.body.appendChild(el);
  return el;
};

describe('UnifiedCoordinateTransform (e2e)', () => {
  const rect = { left: 100, top: 50, width: 800, height: 600 };
  let canvasArea: HTMLDivElement | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    canvasArea = createCanvasArea(rect);
    setProjectStore('canvas', 'size', { width: 500, height: 400 });
    setInteractStore(buildInteract());
    coordinateTransform.clearCache();
  });

  afterEach(() => {
    canvasArea?.remove();
    canvasArea = null;
  });

  it('applies canvas-area offset when converting window/canvas positions', () => {
    setInteractStore(
      buildInteract({
        zoom: 2,
        offset: { x: 30, y: -20 },
      })
    );
    coordinateTransform.clearCache();

    const canvasPos = { x: 100, y: 50, __brand: 'CanvasPos' } as const;
    const windowPos = coordinateTransform.canvasToWindow(canvasPos);

    expect(windowPos.x).toBeCloseTo(330, 6);
    expect(windowPos.y).toBeCloseTo(130, 6);

    const roundTrip = coordinateTransform.windowToCanvas(windowPos);
    expect(roundTrip.x).toBeCloseTo(canvasPos.x, 6);
    expect(roundTrip.y).toBeCloseTo(canvasPos.y, 6);
  });

  it('keeps overlay conversion independent from canvas-area offset', () => {
    setInteractStore(
      buildInteract({
        zoom: 2,
        offset: { x: 30, y: -20 },
      })
    );
    coordinateTransform.clearCache();

    const canvasPos = { x: 100, y: 50, __brand: 'CanvasPos' } as const;
    const windowPos = coordinateTransform.canvasToWindowForOverlay(canvasPos);

    expect(windowPos.x).toBeCloseTo(230, 6);
    expect(windowPos.y).toBeCloseTo(80, 6);
  });
});


