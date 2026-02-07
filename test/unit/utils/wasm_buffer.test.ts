import { describe, expect, it } from 'vitest';

import { create_opacity_mask, flip_pixels_vertically } from '~/utils/wasm';

describe('buffer ops', () => {
  it('flips pixels vertically', () => {
    const width = 2;
    const height = 2;
    const buffer = new Uint8Array([1, 0, 0, 255, 2, 0, 0, 255, 3, 0, 0, 255, 4, 0, 0, 255]);

    flip_pixels_vertically(buffer, width, height);

    expect(Array.from(buffer)).toEqual([3, 0, 0, 255, 4, 0, 0, 255, 1, 0, 0, 255, 2, 0, 0, 255]);
  });

  it('creates opacity mask from alpha channel', () => {
    const width = 2;
    const height = 1;
    const buffer = new Uint8Array([10, 20, 30, 0, 40, 50, 60, 128]);

    const mask = create_opacity_mask(buffer, width, height);

    expect(Array.from(mask)).toEqual([0, 1]);
  });
});
