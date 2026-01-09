import { describe, expect, it } from 'vitest';

import { create_opacity_mask, flip_pixels_vertically, rawToWebp, webpToRaw } from '~/utils/wasm';

describe('compression', () => {
  it('roundtrips raw buffer via rawToWebp/webpToRaw', () => {
    const width = 2;
    const height = 2;
    const raw = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 0]);

    const compressed = rawToWebp(raw, width, height);
    const decoded = webpToRaw(compressed, width, height);

    expect(Array.from(decoded)).toEqual(Array.from(raw));
  });

  it('returns expected length on invalid compressed data', () => {
    const width = 2;
    const height = 2;
    const decoded = webpToRaw(new Uint8Array([0, 1, 2]), width, height);

    expect(decoded.length).toBe(width * height * 4);
  });
});

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
