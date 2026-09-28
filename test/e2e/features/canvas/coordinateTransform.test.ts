import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { coordinateTransform, UnifiedCoordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { defaultInteractStore, InteractStore } from '~/stores/editor/InteractStore';
import { setInteractStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { CanvasPos } from '~/types/CoordinateTypes';

// createStore owns the default object; preserve a pristine snapshot for each case.
const initialInteract = structuredClone(defaultInteractStore);
const buildInteract = (partial: Partial<InteractStore> = {}): InteractStore => ({
  ...initialInteract,
  ...partial,
  lastPointerWindow: { ...initialInteract.lastPointerWindow, ...partial.lastPointerWindow },
  lastPointerOnCanvas: { ...initialInteract.lastPointerOnCanvas, ...partial.lastPointerOnCanvas },
  placementPosition: { ...initialInteract.placementPosition, ...partial.placementPosition },
  offsetOrigin: { ...initialInteract.offsetOrigin, ...partial.offsetOrigin },
  offset: { ...initialInteract.offset, ...partial.offset },
  canvasSizeFrameOffset: { ...initialInteract.canvasSizeFrameOffset, ...partial.canvasSizeFrameOffset },
  canvasSizeFrameSize: { ...initialInteract.canvasSizeFrameSize, ...partial.canvasSizeFrameSize },
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

  const stateChanges = [
    { name: 'zoom', change: () => setInteractStore('zoom', 2.5) },
    { name: 'rotation', change: () => setInteractStore('rotation', 75) },
    { name: 'horizontal flip', change: () => setInteractStore('horizontalFlipped', true) },
    { name: 'vertical flip', change: () => setInteractStore('verticalFlipped', true) },
    { name: 'pan', change: () => setInteractStore('offset', { x: 32, y: -19 }) },
    { name: 'origin', change: () => setInteractStore('offsetOrigin', { x: 64, y: 21 }) },
    { name: 'canvas size', change: () => setProjectStore('canvas', 'size', { width: 710, height: 315 }) },
  ];

  for (const noZoom of [false, true]) {
    it.each(stateChanges)(`refreshes the ${noZoom ? 'no-zoom ' : ''}inverse after $name without a forward call or clearCache`, ({ change }) => {
      setInteractStore('rotation', 30);
      const transform = new UnifiedCoordinateTransform();
      const point = CanvasPos.create(123.5, 87.25);
      const forward = (t: UnifiedCoordinateTransform) => (noZoom ? t.canvasToWindowNoZoom(point) : t.canvasToWindow(point));
      const inverse = (p: ReturnType<typeof forward>) => (noZoom ? transform.windowToCanvasNoZoom(p) : transform.windowToCanvas(p));
      inverse(forward(transform));

      change();
      const result = inverse(forward(new UnifiedCoordinateTransform()));
      expect(result.x).toBeCloseTo(point.x, 3);
      expect(result.y).toBeCloseTo(point.y, 3);
    });
  }
});
