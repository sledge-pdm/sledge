import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { rotateInCenter, zoomTowardWindowPos } from '~/features/canvas';
import { coordinateTransform } from '~/features/canvas/transform/CanvasPositionCalculator';
import { UnifiedCoordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { setInteractStore } from '~/stores/EditorStores';
import { defaultInteractStore, InteractStore } from '~/stores/editor/InteractStore';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { WindowPos } from '~/types/CoordinateTypes';

class DOMPointPolyfill {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

type MatrixLike = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
};

class DOMMatrixPolyfill implements MatrixLike {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  private multiply(m: MatrixLike) {
    const { a, b, c, d, e, f } = this;
    this.a = a * m.a + c * m.b;
    this.b = b * m.a + d * m.b;
    this.c = a * m.c + c * m.d;
    this.d = b * m.c + d * m.d;
    this.e = a * m.e + c * m.f + e;
    this.f = b * m.e + d * m.f + f;
    return this;
  }

  translate(tx = 0, ty = 0) {
    return this.multiply({ a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });
  }

  scale(scaleX = 1, scaleY = scaleX) {
    return this.multiply({ a: scaleX, b: 0, c: 0, d: scaleY, e: 0, f: 0 });
  }

  rotate(angle = 0) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return this.multiply({ a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
  }

  transformPoint(point: DOMPointPolyfill) {
    return {
      x: this.a * point.x + this.c * point.y + this.e,
      y: this.b * point.x + this.d * point.y + this.f,
    };
  }

  inverse() {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return new DOMMatrixPolyfill();
    const inv = new DOMMatrixPolyfill();
    inv.a = this.d / det;
    inv.b = -this.b / det;
    inv.c = -this.c / det;
    inv.d = this.a / det;
    inv.e = (this.c * this.f - this.d * this.e) / det;
    inv.f = (this.b * this.e - this.a * this.f) / det;
    return inv;
  }
}

class DOMRectPolyfill {
  left: number;
  top: number;
  width: number;
  height: number;
  constructor(left = 0, top = 0, width = 0, height = 0) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }
}

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

describe('UnifiedCoordinateTransform (unit)', () => {
  const originalDOMMatrix = globalThis.DOMMatrix;
  const originalDOMPoint = (globalThis as any).DOMPoint;
  const originalDOMRect = (globalThis as any).DOMRect;
  const originalDocument = (globalThis as any).document;

  beforeAll(() => {
    (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
    (globalThis as any).DOMPoint = DOMPointPolyfill;
    (globalThis as any).DOMRect = DOMRectPolyfill;
  });

  afterAll(() => {
    (globalThis as any).DOMMatrix = originalDOMMatrix;
    (globalThis as any).DOMPoint = originalDOMPoint;
    (globalThis as any).DOMRect = originalDOMRect;
    (globalThis as any).document = originalDocument;
  });

  beforeEach(() => {
    setInteractStore(buildInteract());
    setProjectStore('canvas', 'size', { width: 800, height: 600 });
    const element = { getBoundingClientRect: () => new DOMRect(0, 0, 0, 0) };
    (globalThis as any).document = { getElementById: () => element };
  });

  it('maps canvas to window with pan/zoom on the simple path', () => {
    setInteractStore(
      buildInteract({
        zoom: 2,
        offsetOrigin: { x: 10, y: 20 },
        offset: { x: 5, y: -7 },
      })
    );

    const transform = new UnifiedCoordinateTransform();
    const windowPos = transform.canvasToWindow({ x: 30, y: 40, __brand: 'CanvasPos' });

    expect(windowPos.x).toBeCloseTo(75, 6);
    expect(windowPos.y).toBeCloseTo(93, 6);

    const canvasPos = transform.windowToCanvas(windowPos);
    expect(canvasPos.x).toBeCloseTo(30, 6);
    expect(canvasPos.y).toBeCloseTo(40, 6);
  });

  it('round-trips with rotation and flips via matrix path', () => {
    setInteractStore(
      buildInteract({
        zoom: 1.2,
        rotation: 30,
        horizontalFlipped: true,
        verticalFlipped: false,
        offsetOrigin: { x: 12, y: -8 },
        offset: { x: 3, y: 4 },
      })
    );

    const transform = new UnifiedCoordinateTransform();
    const original = { x: 120.5, y: 88.25, __brand: 'CanvasPos' } as const;
    const windowPos = transform.canvasToWindow(original);
    const roundTrip = transform.windowToCanvas(windowPos);

    expect(roundTrip.x).toBeCloseTo(original.x, 6);
    expect(roundTrip.y).toBeCloseTo(original.y, 6);
  });

  it('keeps no-zoom transforms stable across zoom changes', () => {
    setInteractStore(
      buildInteract({
        zoom: 2,
        offsetOrigin: { x: 5, y: 6 },
        offset: { x: 1, y: 2 },
      })
    );

    const transform = new UnifiedCoordinateTransform();
    const pos = { x: 10, y: 20, __brand: 'CanvasPos' } as const;
    const before = transform.canvasToWindowNoZoom(pos);

    setInteractStore('zoom', 5);
    transform.clearCache();

    const after = transform.canvasToWindowNoZoom(pos);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
  });

  it('matches matrix path when rotation and flips are neutral', () => {
    setInteractStore(
      buildInteract({
        zoom: 1.3,
        offsetOrigin: { x: -20, y: 40 },
        offset: { x: 8, y: -12 },
      })
    );

    const fast = new UnifiedCoordinateTransform();
    const slow = new UnifiedCoordinateTransform();
    (slow as any).canUseSimpleTransform = () => false;

    const canvasPos = { x: 77, y: 31, __brand: 'CanvasPos' } as const;
    const fastWindow = fast.canvasToWindow(canvasPos);
    const slowWindow = slow.canvasToWindow(canvasPos);

    expect(fastWindow.x).toBeCloseTo(slowWindow.x, 6);
    expect(fastWindow.y).toBeCloseTo(slowWindow.y, 6);

    const windowPos = { x: 250, y: 180, __brand: 'WindowPos' } as const;
    const fastCanvas = fast.windowToCanvas(windowPos);
    const slowCanvas = slow.windowToCanvas(windowPos);

    expect(fastCanvas.x).toBeCloseTo(slowCanvas.x, 6);
    expect(fastCanvas.y).toBeCloseTo(slowCanvas.y, 6);
  });

  it('reuses canvas-area rect cache within 100ms', () => {
    const rect = { left: 100, top: 50, width: 800, height: 600 };
    const element = { getBoundingClientRect: vi.fn(() => rect) };
    const getElementById = vi.fn(() => element);
    (globalThis as any).document = { getElementById };

    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(50).mockReturnValueOnce(150);

    const transform = new UnifiedCoordinateTransform();
    transform.windowToCanvas({ x: 120, y: 80, __brand: 'WindowPos' });
    transform.windowToCanvas({ x: 140, y: 90, __brand: 'WindowPos' });
    transform.windowToCanvas({ x: 160, y: 100, __brand: 'WindowPos' });

    expect(getElementById).toHaveBeenCalledTimes(2);
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('keeps target window position stable after rotation', () => {
    setInteractStore(
      buildInteract({
        zoom: 1,
        rotation: 0,
        offset: { x: 0, y: 0 },
      })
    );
    coordinateTransform.clearCache();

    const centerWindow = WindowPos.from({ x: 120, y: 80 });
    const canvasPos = coordinateTransform.windowToCanvas(centerWindow);

    rotateInCenter(centerWindow, 45);

    const afterWindow = coordinateTransform.canvasToWindow(canvasPos);
    expect(afterWindow.x).toBeCloseTo(centerWindow.x, 6);
    expect(afterWindow.y).toBeCloseTo(centerWindow.y, 6);
  });

  it('keeps target window position stable after zoom', () => {
    setInteractStore('zoom', 1);
    setInteractStore('initialZoom', 1);
    setInteractStore('rotation', 0);
    setInteractStore('horizontalFlipped', false);
    setInteractStore('verticalFlipped', false);
    setInteractStore('offsetOrigin', { x: 0, y: 0 });
    setInteractStore('offset', { x: 0, y: 0 });
    coordinateTransform.clearCache();

    const focusWindow = WindowPos.from({ x: 140, y: 110 });
    const canvasPos = coordinateTransform.windowToCanvas(focusWindow);

    zoomTowardWindowPos(focusWindow, 2);

    const afterCanvas = coordinateTransform.windowToCanvas(focusWindow);
    expect(afterCanvas.x).toBeCloseTo(canvasPos.x, 6);
    expect(afterCanvas.y).toBeCloseTo(canvasPos.y, 6);
  });
});



