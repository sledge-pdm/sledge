import * as wasm from '@sledge/wasm';
import { describe, expect, it } from 'vitest';

function makeRGBA(width: number, height: number, r = 0, g = 0, b = 0, a = 0) {
  const buf = new Uint8Array(width * height * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  }
  return buf;
}

function setPx(buf: Uint8Array, width: number, x: number, y: number, rgba: [number, number, number, number]) {
  const idx = (y * width + x) * 4;
  buf[idx + 0] = rgba[0];
  buf[idx + 1] = rgba[1];
  buf[idx + 2] = rgba[2];
  buf[idx + 3] = rgba[3];
}

function getPx(buf: Uint8Array, width: number, x: number, y: number): [number, number, number, number] {
  const idx = (y * width + x) * 4;
  return [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
}

describe('wasm.patch_buffer', () => {
  it('overwrites opaque patch pixels onto transparent target', () => {
    const tw = 8,
      th = 8;
    const target = makeRGBA(tw, th, 0, 0, 0, 0);

    const pw = 2,
      ph = 2;
    const patch = makeRGBA(pw, ph, 255, 0, 0, 255);

    const res = (wasm as any).patch_buffer(target, tw, th, patch, pw, ph, 3, 4) as Uint8Array;

    expect(getPx(res, tw, 3, 4)).toEqual([255, 0, 0, 255]);
    expect(getPx(res, tw, 4, 4)).toEqual([255, 0, 0, 255]);
    expect(getPx(res, tw, 3, 5)).toEqual([255, 0, 0, 255]);
    expect(getPx(res, tw, 4, 5)).toEqual([255, 0, 0, 255]);
    // outside untouched
    expect(getPx(res, tw, 2, 4)).toEqual([0, 0, 0, 0]);
  });

  it('alpha-blends semi-transparent patch', () => {
    const tw = 4,
      th = 4;
    const target = makeRGBA(tw, th, 0, 0, 255, 255); // solid blue

    const pw = 1,
      ph = 1;
    const patch = makeRGBA(pw, ph, 255, 0, 0, 128); // half-transparent red

    const res = (wasm as any).patch_buffer(target, tw, th, patch, pw, ph, 1, 1) as Uint8Array;

    const [r, g, b, a] = getPx(res, tw, 1, 1);
    // Expected: src over dst => r≈127,g≈0,b≈127, a≈255
    expect(r).toBeGreaterThan(120);
    expect(b).toBeGreaterThan(120);
    expect(a).toBe(255);
  });

  it('clips outside target bounds', () => {
    const tw = 3,
      th = 3;
    const target = makeRGBA(tw, th, 0, 0, 0, 0);

    const pw = 3,
      ph = 3;
    const patch = makeRGBA(pw, ph, 0, 255, 0, 255);

    const res = (wasm as any).patch_buffer(target, tw, th, patch, pw, ph, 2, 2) as Uint8Array;

    // Only bottom-right pixel should be affected
    expect(getPx(res, tw, 2, 2)).toEqual([0, 255, 0, 255]);
    expect(getPx(res, tw, 1, 1)).toEqual([0, 0, 0, 0]);
  });
});
