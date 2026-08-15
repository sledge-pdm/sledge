import { describe, expect, it } from 'vitest';
import { hasMaskPixels, readColorFromBuffer, selectColorRangeMask } from '~/features/selection/color_selection';

describe('color selection mask', () => {
  it('matches exact RGBA when threshold is zero', () => {
    const buffer = new Uint8ClampedArray([10, 20, 30, 255, 10, 20, 30, 128, 40, 50, 60, 255]);

    const mask = selectColorRangeMask(buffer, 3, 1, [10, 20, 30, 255], 0);

    expect(Array.from(mask)).toEqual([1, 0, 0]);
  });

  it('matches RGB range when threshold is above zero', () => {
    const buffer = new Uint8ClampedArray([100, 110, 120, 0, 104, 108, 119, 255, 115, 110, 120, 255]);

    const mask = selectColorRangeMask(buffer, 3, 1, [100, 110, 120, 255], 4);

    expect(Array.from(mask)).toEqual([1, 1, 0]);
  });

  it('reports empty masks and reads colors by pixel coordinate', () => {
    const buffer = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    const emptyMask = selectColorRangeMask(buffer, 2, 2, [255, 255, 255, 255], 0);

    expect(hasMaskPixels(emptyMask)).toBe(false);
    expect(readColorFromBuffer(buffer, 2, 2, 1, 1)).toEqual([13, 14, 15, 16]);
    expect(readColorFromBuffer(buffer, 2, 2, 2, 0)).toBeUndefined();
  });
});
