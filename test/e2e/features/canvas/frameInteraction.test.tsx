import type { ImagePoolEntry } from '@sledge-pdm/core';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CanvasAreaInteract from '~/components/canvas/CanvasAreaInteract';
import Image from '~/components/canvas/overlays/image_pool/Image';
import { coordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { hasExclusiveEditSession } from '~/features/edit_session';
import { historyManager } from '~/features/history';
import { selectionManager } from '~/features/selection/SelectionManager';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { interactStore, setInteractStore, setToolStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

type Point = { x: number; y: number };
const initialInteract = structuredClone(defaultInteractStore);
const opposite: Record<string, string> = { n: 's', ne: 'sw', e: 'w', se: 'nw', s: 'n', sw: 'ne', w: 'e', nw: 'se' };
const center = (el: Element): Point => {
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};
const expectPoint = (actual: Point, expected: Point, tolerance = 0.08) => {
  expect(Math.hypot(actual.x - expected.x, actual.y - expected.y)).toBeLessThan(tolerance);
};
const pointer = (target: Element, type: string, at: Point, extra: PointerEventInit = {}) => {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: at.x,
      clientY: at.y,
      bubbles: true,
      ...extra,
    })
  );
};

describe('on-canvas frame interactions (browser)', () => {
  let area: HTMLDivElement;
  let dispose: (() => void) | undefined;
  let pan: CanvasAreaInteract | undefined;
  let svg: SVGSVGElement;
  const handle = (pos: string) => svg.querySelector(`[data-pos="${pos}"]`)!;
  const entry = () => projectStore.imagePool.entries[0];
  const frameDelta = (x: number, y: number) => {
    const matrix = svg.getScreenCTM()!;
    return { x: matrix.a * x + matrix.c * y, y: matrix.b * x + matrix.d * y };
  };
  const captureForDispatchedEvents = () => {
    // Synthetic events do not establish a native active pointer. Capture ownership is
    // checked separately with real Playwright input against the running application.
    vi.spyOn(svg, 'setPointerCapture').mockImplementation(() => {});
    vi.spyOn(svg, 'releasePointerCapture').mockImplementation(() => {});
  };
  const mountImage = (rotation = 0, preserveAspectRatio = false) => {
    const image: ImagePoolEntry = {
      id: 'frame-test-image',
      base: { width: 120, height: 80 },
      transform: { x: 80, y: 60, scaleX: 1, scaleY: 1, rotation, flipX: false, flipY: false },
      opacity: 1,
      visible: true,
    };
    setProjectStore('imagePool', 'entries', [image]);
    setProjectStore('imagePool', 'state', { selectedEntryId: image.id, preserveAspectRatio });
    dispose = render(
      () => (
        <div style={{ position: 'absolute', 'transform-origin': '0 0', transform: coordinateTransform.getTransformMatrix().toString() }}>
          <Image entry={entry()} index={0} />
        </div>
      ),
      area
    );
    svg = area.querySelector('svg')!;
    captureForDispatchedEvents();
  };

  beforeEach(() => {
    historyManager.clearHistory();
    selectionManager.clearAll();
    setToolStore('activeToolCategory', 'pen');
    setProjectStore('canvas', 'size', { width: 500, height: 400 });
    setInteractStore({
      ...structuredClone(initialInteract),
      offset: { x: 0, y: 0 },
      offsetOrigin: { x: 180, y: 140 },
      canvasSizeFrameOffset: { x: 0, y: 0 },
      canvasSizeFrameSize: { width: 0, height: 0 },
    });
    coordinateTransform.clearCache();
    area = document.createElement('div');
    area.id = 'canvas-area';
    area.style.cssText = 'position:absolute;left:100px;top:50px;width:900px;height:700px;';
    document.body.appendChild(area);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    pan?.removeInteractListeners();
    pan = undefined;
    area.remove();
    vi.restoreAllMocks();
    expect(hasExclusiveEditSession()).toBe(false);
  });

  for (const orientation of [
    { imageRotation: 0, rotation: 0, horizontalFlipped: false, verticalFlipped: false, zoom: 0.5 },
    { imageRotation: 90, rotation: 0, horizontalFlipped: false, verticalFlipped: false, zoom: 1 },
    { imageRotation: 30, rotation: 35, horizontalFlipped: true, verticalFlipped: false, zoom: 2 },
    { imageRotation: -25, rotation: -70, horizontalFlipped: false, verticalFlipped: true, zoom: 0.75 },
  ]) {
    it.each(Object.keys(opposite))(`resizes %s with fixed opposite handle (${JSON.stringify(orientation)})`, (pos) => {
      setInteractStore(orientation);
      mountImage(orientation.imageRotation);
      const start = center(handle(pos));
      const fixed = center(handle(opposite[pos]));
      const dx = pos.includes('e') ? 24 : pos.includes('w') ? -24 : 0;
      const dy = pos.includes('s') ? 16 : pos.includes('n') ? -16 : 0;
      const delta = frameDelta(dx, dy);
      const end = { x: start.x + delta.x, y: start.y + delta.y };
      pointer(handle(pos), 'pointerdown', start);
      pointer(svg, 'pointermove', end);
      pointer(svg, 'pointerup', end);
      expectPoint(center(handle(pos)), end);
      expectPoint(center(handle(opposite[pos])), fixed);
      expect(entry().transform.scaleX * 120).toBeCloseTo(dx ? 144 : 120, 3);
      expect(entry().transform.scaleY * 80).toBeCloseTo(dy ? 96 : 80, 3);
      expect(historyManager.getUndoStack()).toHaveLength(1);
      historyManager.undo();
      expectPoint(center(handle(pos)), start);
      historyManager.redo();
      expectPoint(center(handle(pos)), end);
    });
  }

  it('keeps a rotated corner anchored across inversion and back', () => {
    setInteractStore({ rotation: 35, horizontalFlipped: true, zoom: 2 });
    mountImage(30);
    const start = center(handle('se')),
      fixed = center(handle('nw'));
    const delta = frameDelta(-160, 0);
    const end = { x: start.x + delta.x, y: start.y + delta.y };
    pointer(handle('se'), 'pointerdown', start);
    pointer(svg, 'pointermove', end);
    expect(entry().transform.flipX).toBe(true);
    expect(entry().transform.flipY).toBe(false);
    expectPoint(center(handle('sw')), end);
    expectPoint(center(handle('ne')), fixed);
    pointer(svg, 'pointermove', start);
    pointer(svg, 'pointerup', start);
    expect(entry().transform.flipX).toBe(false);
    expectPoint(center(handle('se')), start);
    expectPoint(center(handle('nw')), fixed);
  });

  it.each(['e', 'nw'])('preserves aspect and the opposite anchor while resizing %s with Shift', (pos) => {
    mountImage(30);
    const start = center(handle(pos)),
      fixed = center(handle(opposite[pos]));
    const delta = frameDelta(pos === 'e' ? 30 : -30, pos === 'e' ? 0 : -20);
    const end = { x: start.x + delta.x, y: start.y + delta.y };
    pointer(handle(pos), 'pointerdown', start);
    pointer(svg, 'pointermove', end, { shiftKey: true });
    pointer(svg, 'pointerup', end, { shiftKey: true });
    expectPoint(center(handle(pos)), end);
    expectPoint(center(handle(opposite[pos])), fixed);
    expect(entry().transform.scaleX).toBeCloseTo(entry().transform.scaleY, 5);
  });

  it('applies the saved aspect setting on mount and flips only the dragged edge axis', () => {
    mountImage(30, true);
    const start = center(handle('e'));
    const fixed = center(handle('w'));
    const delta = frameDelta(-160, 0);
    const end = { x: start.x + delta.x, y: start.y + delta.y };
    pointer(handle('e'), 'pointerdown', start);
    pointer(svg, 'pointermove', end);
    pointer(svg, 'pointerup', end);
    expect(entry().transform.flipX).toBe(true);
    expect(entry().transform.flipY).toBe(false);
    expect(entry().transform.scaleX).toBeCloseTo(entry().transform.scaleY, 5);
    expectPoint(center(handle('w')), end);
    expectPoint(center(handle('e')), fixed);
  });

  it('preserves the opposite corner when both dimensions invert', () => {
    mountImage(30);
    const start = center(handle('se'));
    const fixed = center(handle('nw'));
    const delta = frameDelta(-160, -100);
    const end = { x: start.x + delta.x, y: start.y + delta.y };
    pointer(handle('se'), 'pointerdown', start);
    pointer(svg, 'pointermove', end);
    pointer(svg, 'pointerup', end);
    expect(entry().transform.flipX).toBe(true);
    expect(entry().transform.flipY).toBe(true);
    expectPoint(center(handle('nw')), end);
    expectPoint(center(handle('se')), fixed);
  });

  it('keeps the opposite edge fixed when width reaches the minimum', () => {
    mountImage(30);
    const start = center(handle('w'));
    const fixed = center(handle('e'));
    const delta = frameDelta(119.8, 0);
    const end = { x: start.x + delta.x, y: start.y + delta.y };
    pointer(handle('w'), 'pointerdown', start);
    pointer(svg, 'pointermove', end);
    pointer(svg, 'pointerup', end);
    expect(entry().transform.scaleX * 120).toBeCloseTo(1, 5);
    expectPoint(center(handle('e')), fixed);
  });

  it('commits capture loss once and ignores later hover or pointerup', () => {
    mountImage(30);
    const body = svg.querySelector('.drag-surface')!,
      start = center(body);
    const end = { x: start.x + 20, y: start.y + 10 };
    pointer(body, 'pointerdown', start);
    pointer(svg, 'pointermove', end);
    expect(hasExclusiveEditSession()).toBe(true);
    pointer(svg, 'lostpointercapture', end);
    expect(hasExclusiveEditSession()).toBe(false);
    pointer(svg, 'pointermove', { x: end.x + 30, y: end.y + 40 }, { buttons: 0 });
    pointer(svg, 'pointerup', { x: end.x + 30, y: end.y + 40 });
    expectPoint(center(body), end);
    expect(historyManager.getUndoStack()).toHaveLength(1);
  });

  it('leaves touch and Ctrl-pan to the canvas and does not move on hover afterward', () => {
    mountImage();
    pan = new CanvasAreaInteract(area.firstElementChild as HTMLDivElement, area);
    vi.spyOn(area, 'setPointerCapture').mockImplementation(() => {});
    vi.spyOn(area, 'releasePointerCapture').mockImplementation(() => {});
    pan.setInteractListeners();
    const body = svg.querySelector('.drag-surface')!,
      start = center(body);
    pointer(body, 'pointerdown', start, { ctrlKey: true });
    expect(hasExclusiveEditSession()).toBe(false);
    const end = { x: start.x + 30, y: start.y + 20 };
    pointer(area, 'pointermove', end, { ctrlKey: true });
    pointer(area, 'pointerup', end);
    pointer(body, 'pointermove', { x: end.x + 10, y: end.y + 5 }, { buttons: 0 });
    expect(entry().transform.x).toBe(80);
    expect(entry().transform.y).toBe(60);
    expect(interactStore.offset).toEqual({ x: 30, y: 20 });
    pointer(body, 'pointerdown', end, { pointerId: 2, pointerType: 'touch' });
    expect(hasExclusiveEditSession()).toBe(false);
    pointer(area, 'pointerup', end, { pointerId: 2, pointerType: 'touch' });
  });

  it('ignores another pointer and cancels only the captured gesture', () => {
    mountImage();
    const body = svg.querySelector('.drag-surface')!,
      start = center(body);
    const end = { x: start.x + 20, y: start.y + 10 };
    pointer(body, 'pointerdown', start);
    pointer(svg, 'pointermove', { x: start.x + 200, y: start.y + 200 }, { pointerId: 2 });
    pointer(svg, 'pointercancel', start, { pointerId: 2 });
    expect(hasExclusiveEditSession()).toBe(true);
    expectPoint(center(body), start);
    pointer(svg, 'pointermove', end);
    pointer(svg, 'pointercancel', end);
    expectPoint(center(body), start);
    expect(historyManager.getUndoStack()).toHaveLength(0);
  });

  it('finishes at the last held position when a move arrives with no button down', () => {
    mountImage();
    const body = svg.querySelector('.drag-surface')!,
      start = center(body);
    const end = { x: start.x + 20, y: start.y + 10 };
    pointer(body, 'pointerdown', start);
    pointer(svg, 'pointermove', end);
    pointer(svg, 'pointermove', { x: end.x + 30, y: end.y }, { buttons: 0 });
    expectPoint(center(body), end);
    expect(hasExclusiveEditSession()).toBe(false);
    expect(historyManager.getUndoStack()).toHaveLength(1);
  });

  it('commits and releases the gesture when an image is unmounted', () => {
    mountImage();
    const body = svg.querySelector('.drag-surface')!,
      start = center(body);
    pointer(body, 'pointerdown', start);
    pointer(svg, 'pointermove', { x: start.x + 20, y: start.y + 10 });
    dispose!();
    dispose = undefined;
    expect(hasExclusiveEditSession()).toBe(false);
    expect(historyManager.getUndoStack()).toHaveLength(1);
  });
});
