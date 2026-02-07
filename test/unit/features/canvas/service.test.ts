import { beforeEach, describe, expect, it } from 'vitest';
import { clipZoom, normalizeRotation, resizeBufferWithOrigins, toLayerOrigin } from '~/features/canvas/service';
import { defaultInteractStore } from '~/stores/editor/InteractStore';
import { setInteractStore } from '~/stores/EditorStores';

const px = (r: number, g: number, b: number, a: number) => [r, g, b, a];

describe('canvas service', () => {
  beforeEach(() => {
    setInteractStore({
      ...defaultInteractStore,
      initialZoom: 2,
      zoomMinFromInitial: 0.5,
      zoomMaxFromInitial: 3,
    });
  });

  it('clipZoom clamps values to min/max range derived from initialZoom', () => {
    expect(clipZoom(0.1)).toBe(1);
    expect(clipZoom(3.5)).toBe(3.5);
    expect(clipZoom(10)).toBe(6);
  });

  it('resizeBufferWithOrigins keeps pixels when size and origins are unchanged', () => {
    const src = new Uint8ClampedArray([...px(1, 0, 0, 255), ...px(2, 0, 0, 255), ...px(3, 0, 0, 255), ...px(4, 0, 0, 255)]);
    const out = resizeBufferWithOrigins(src, { width: 2, height: 2 }, { width: 2, height: 2 }, { x: 0, y: 0 }, { x: 0, y: 0 });

    expect(Array.from(out)).toEqual(Array.from(src));
  });

  it('resizeBufferWithOrigins places source pixels at destination origin', () => {
    const src = new Uint8ClampedArray([...px(10, 0, 0, 255), ...px(20, 0, 0, 255), ...px(30, 0, 0, 255), ...px(40, 0, 0, 255)]);
    const out = resizeBufferWithOrigins(src, { width: 2, height: 2 }, { width: 3, height: 3 }, { x: 0, y: 0 }, { x: 1, y: 1 });
    const toR = (x: number, y: number) => out[(y * 3 + x) * 4];

    expect(toR(1, 1)).toBe(10);
    expect(toR(2, 1)).toBe(20);
    expect(toR(1, 2)).toBe(30);
    expect(toR(2, 2)).toBe(40);
    expect(toR(0, 0)).toBe(0);
  });

  it('resizeBufferWithOrigins returns empty buffer when source/target size is invalid', () => {
    const src = new Uint8ClampedArray(0);
    const out = resizeBufferWithOrigins(src, { width: 0, height: 2 }, { width: 2, height: 2 }, { x: 0, y: 0 }, { x: 0, y: 0 });

    expect(out.length).toBe(0);
  });

  it('toLayerOrigin floors values and flips y axis', () => {
    expect(toLayerOrigin({ x: 1.9, y: 2.1 }, 10)).toEqual({ x: 1, y: 7 });
  });

  it('normalizeRotation keeps values in (-180, 180] space', () => {
    expect(normalizeRotation(270)).toBe(-90);
    expect(normalizeRotation(-181)).toBe(179);
    expect(normalizeRotation(180)).toBe(180);
    expect(normalizeRotation(-180)).toBe(-180);
  });
});
