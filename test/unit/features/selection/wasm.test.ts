import { describe, expect, it } from 'vitest';

import {
  apply_mask_offset,
  combine_masks_add,
  combine_masks_replace,
  combine_masks_subtract,
  fill_lasso_selection,
  fill_rect_mask,
  mask_to_path,
  trim_mask_with_box,
} from '~/utils/wasm';

describe('selection ops', () => {
  it('combines masks with add/subtract/replace', () => {
    const base = new Uint8Array([0, 1, 0, 1]);
    const preview = new Uint8Array([1, 0, 1, 0]);

    const added = combine_masks_add(base, preview);
    expect(Array.from(added)).toEqual([1, 1, 1, 1]);

    const subtracted = combine_masks_subtract(new Uint8Array([1, 1, 0, 0]), preview);
    expect(Array.from(subtracted)).toEqual([0, 1, 0, 0]);

    const replaced = combine_masks_replace(preview);
    expect(Array.from(replaced)).toEqual(Array.from(preview));
  });

  it('applies mask offset', () => {
    const width = 3;
    const height = 3;
    const mask = new Uint8Array(width * height);
    mask[1 * width + 1] = 1;

    const shifted = apply_mask_offset(mask, width, height, 1, -1);
    const expected = new Uint8Array(width * height);
    expected[0 * width + 2] = 1;

    expect(Array.from(shifted)).toEqual(Array.from(expected));
  });

  it('fills a rectangular mask region', () => {
    const width = 4;
    const height = 4;
    const mask = new Uint8Array(width * height);

    fill_rect_mask(mask, width, height, 1, 1, 2, 2);

    const expected = new Uint8Array(width * height);
    expected[1 * width + 1] = 1;
    expected[1 * width + 2] = 1;
    expected[2 * width + 1] = 1;
    expected[2 * width + 2] = 1;

    expect(Array.from(mask)).toEqual(Array.from(expected));
  });

  it('trims a mask with a bounding box', () => {
    const width = 4;
    const height = 4;
    const mask = new Uint8Array([0, 0, 0, 0, 0, 1, 2, 0, 0, 3, 4, 0, 0, 0, 0, 0]);

    const trimmed = trim_mask_with_box(mask, width, height, 1, 1, 2, 2);
    expect(Array.from(trimmed)).toEqual([1, 2, 3, 4]);
  });

  it('generates a non-empty path for a simple mask', () => {
    const width = 1;
    const height = 1;
    const mask = new Uint8Array([1]);

    const path = mask_to_path(mask, width, height, 0, 0);
    expect(path).toContain('M');
    expect(path).toContain('Z');
  });

  it('fills lasso selection within bounds', () => {
    const width = 5;
    const height = 5;
    const mask = new Uint8Array(width * height);
    const points = new Float32Array([1, 1, 3, 1, 3, 3, 1, 3]);

    const ok = fill_lasso_selection(mask, width, height, points, 'evenodd');
    expect(ok).toBe(true);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x] === 1) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    expect(minX).toBeGreaterThanOrEqual(1);
    expect(minY).toBeGreaterThanOrEqual(1);
    expect(maxX).toBeLessThanOrEqual(2);
    expect(maxY).toBeLessThanOrEqual(2);
  });
});
