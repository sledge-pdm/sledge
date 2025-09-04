import { scanline_flood_fill, scanline_flood_fill_with_mask } from '@sledge/wasm';
import { describe, expect, it } from 'vitest';

function makeBuffer(w: number, h: number, rgba: [number, number, number, number]) {
  const buf = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    buf[p] = rgba[0];
    buf[p + 1] = rgba[1];
    buf[p + 2] = rgba[2];
    buf[p + 3] = rgba[3];
  }
  return buf;
}

describe('WASM flood fill', () => {
  const W = 8,
    H = 8;

  it('fills contiguous region starting from seed (no mask)', () => {
    // Checker pattern: seed at (0,0) should fill only same-color pixels under threshold 0
    const a: [number, number, number, number] = [10, 10, 10, 255];
    const b: [number, number, number, number] = [20, 20, 20, 255];
    const buf = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = (y * W + x) * 4;
        const c = (x + y) % 2 === 0 ? a : b;
        buf[p] = c[0];
        buf[p + 1] = c[1];
        buf[p + 2] = c[2];
        buf[p + 3] = c[3];
      }
    }
    const fill: [number, number, number, number] = [99, 50, 0, 255];
    const ok = scanline_flood_fill(buf, W, H, 0, 0, fill[0], fill[1], fill[2], fill[3], 0);
    expect(ok).toBe(true);
    // (0,0)と同色の斜め以外の連結はチェッカーだと孤立（自身のみ）
    expect([buf[0], buf[1], buf[2], buf[3]]).toEqual(fill);
    // 隣(1,0)は異色のため非到達
    const q = (0 * W + 1) * 4;
    expect([buf[q], buf[q + 1], buf[q + 2], buf[q + 3]]).toEqual(b);
  });

  it('threshold allows near colors to be included', () => {
    const base: [number, number, number, number] = [100, 100, 100, 255];
    const near: [number, number, number, number] = [110, 101, 99, 255];
    const far: [number, number, number, number] = [140, 140, 140, 255];
    const buf = makeBuffer(W, H, base);
    // put a near-colored line across row 0 except x=0
    for (let x = 1; x < W; x++) {
      const p = (0 * W + x) * 4;
      buf[p] = near[0];
      buf[p + 1] = near[1];
      buf[p + 2] = near[2];
      buf[p + 3] = near[3];
    }
    // far at (0,1)
    const pf = (1 * W + 0) * 4;
    buf[pf] = far[0];
    buf[pf + 1] = far[1];
    buf[pf + 2] = far[2];
    buf[pf + 3] = far[3];

    const fill: [number, number, number, number] = [1, 2, 3, 255];
    const ok = scanline_flood_fill(buf, W, H, 0, 0, fill[0], fill[1], fill[2], fill[3], 15);
    expect(ok).toBe(true);
    // row 0 should all be filled (near is within threshold)
    for (let x = 0; x < W; x++) {
      const p = (0 * W + x) * 4;
      expect([buf[p], buf[p + 1], buf[p + 2], buf[p + 3]]).toEqual(fill);
    }
    // (0,1) remains far color
    const p2 = (1 * W + 0) * 4;
    expect([buf[p2], buf[p2 + 1], buf[p2 + 2], buf[p2 + 3]]).toEqual(far);
  });

  it('mask limits fill area (inside mode)', () => {
    const base: [number, number, number, number] = [0, 0, 0, 255];
    const buf = makeBuffer(W, H, base);
    const mask = new Uint8Array(W * H).fill(0);
    // allow only a 2x2 area at top-left
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) mask[y * W + x] = 1;
    const fill: [number, number, number, number] = [200, 0, 0, 255];
    const ok = scanline_flood_fill_with_mask(buf, W, H, 0, 0, fill[0], fill[1], fill[2], fill[3], 0, mask, 'inside');
    expect(ok).toBe(true);
    // Only 2x2 is filled
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = (y * W + x) * 4;
        const expected = x < 2 && y < 2 ? fill : base;
        expect([buf[p], buf[p + 1], buf[p + 2], buf[p + 3]]).toEqual(expected);
      }
  });
});
