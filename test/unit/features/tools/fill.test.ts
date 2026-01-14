import { describe, expect, it } from 'vitest';

import { fill_mask_area, scanline_flood_fill, scanline_flood_fill_with_mask } from '~/utils/wasm';

describe('fill ops', () => {
  it('fills masked pixels with fill_mask_area', () => {
    const width = 2;
    const height = 2;
    const buffer = new Uint8Array(width * height * 4);
    const mask = new Uint8Array([1, 0, 0, 1]);

    const ok = fill_mask_area(buffer, mask, 1, 2, 3, 4);
    expect(ok).toBe(true);

    const expected = new Uint8Array([1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4]);
    expect(Array.from(buffer)).toEqual(Array.from(expected));
  });

  it('flood fills contiguous region', () => {
    const width = 3;
    const height = 3;
    const buffer = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      buffer[idx] = 10;
      buffer[idx + 1] = 10;
      buffer[idx + 2] = 10;
      buffer[idx + 3] = 255;
    }

    const ok = scanline_flood_fill(buffer, width, height, 1, 1, 20, 30, 40, 255, 0);
    expect(ok).toBe(true);

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      expect(buffer[idx]).toBe(20);
      expect(buffer[idx + 1]).toBe(30);
      expect(buffer[idx + 2]).toBe(40);
      expect(buffer[idx + 3]).toBe(255);
    }
  });

  it('returns false when start is out of bounds', () => {
    const width = 2;
    const height = 2;
    const buffer = new Uint8Array(width * height * 4);

    const ok = scanline_flood_fill(buffer, width, height, -1, 0, 1, 1, 1, 255, 0);
    expect(ok).toBe(false);
  });

  it('respects threshold for flood fill', () => {
    const width = 3;
    const height = 3;
    const buffer = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      buffer[idx] = 20;
      buffer[idx + 1] = 20;
      buffer[idx + 2] = 20;
      buffer[idx + 3] = 255;
    }
    const center = (1 * width + 1) * 4;
    buffer[center] = 10;
    buffer[center + 1] = 10;
    buffer[center + 2] = 10;
    buffer[center + 3] = 255;

    const ok = scanline_flood_fill(buffer, width, height, 1, 1, 7, 8, 9, 255, 0);
    expect(ok).toBe(true);

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      if (i === 4) {
        expect([buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]]).toEqual([7, 8, 9, 255]);
      } else {
        expect([buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]]).toEqual([20, 20, 20, 255]);
      }
    }
  });

  it('flood fills only inside selection mask', () => {
    const width = 3;
    const height = 3;
    const buffer = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      buffer[idx] = 5;
      buffer[idx + 1] = 5;
      buffer[idx + 2] = 5;
      buffer[idx + 3] = 255;
    }

    const mask = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 1, 0]);

    const ok = scanline_flood_fill_with_mask(buffer, width, height, 1, 1, 9, 9, 9, 255, 0, mask, 'inside');
    expect(ok).toBe(true);

    const getPixel = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      return [buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]];
    };

    expect(getPixel(1, 1)).toEqual([9, 9, 9, 255]);
    expect(getPixel(1, 2)).toEqual([9, 9, 9, 255]);
    expect(getPixel(0, 0)).toEqual([5, 5, 5, 255]);
  });

  it('fills only outside selection mask when limited', () => {
    const width = 3;
    const height = 3;
    const buffer = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      buffer[idx] = 7;
      buffer[idx + 1] = 7;
      buffer[idx + 2] = 7;
      buffer[idx + 3] = 255;
    }

    const mask = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);

    const ok = scanline_flood_fill_with_mask(buffer, width, height, 0, 0, 2, 3, 4, 255, 255, mask, 'outside');
    expect(ok).toBe(true);

    const center = (1 * width + 1) * 4;
    expect([buffer[center], buffer[center + 1], buffer[center + 2], buffer[center + 3]]).toEqual([7, 7, 7, 255]);

    for (let i = 0; i < width * height; i++) {
      if (i === 4) continue;
      const idx = i * 4;
      expect([buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]]).toEqual([2, 3, 4, 255]);
    }
  });
});
