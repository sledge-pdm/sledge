import { beforeEach, describe, expect, it } from 'vitest';
import type { RGBAColor } from '~/features/color';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';

function makeBuffer(w: number, h: number, color: RGBAColor = [0, 0, 0, 0]) {
  const buf = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = color[0];
    buf[i + 1] = color[1];
    buf[i + 2] = color[2];
    buf[i + 3] = color[3];
  }
  return buf;
}

describe('Anvil integration with LayerImageAgent', () => {
  const W = 64,
    H = 64;

  beforeEach(() => {
    // Clean up anvils before each test
    (anvilManager as any).anvils.clear();
  });

  it('should create anvil instance alongside LayerImageAgent', () => {
    const initial: RGBAColor = [100, 150, 200, 255];
    const buf = makeBuffer(W, H, initial);

    const anvil = anvilManager.registerAnvil('L1', buf, W, H);

    expect(anvil).toBeDefined();
    expect(anvil?.getWidth()).toBe(W);
    expect(anvil?.getHeight()).toBe(H);
  });

  it('should sync buffer data between agent and anvil', () => {
    const initial: RGBAColor = [100, 150, 200, 255];
    const buf = makeBuffer(W, H, initial);

    const anvil = anvilManager.registerAnvil('L1', buf, W, H);

    // Check that anvil has the same pixel data
    const anvilPixel = anvil.getPixel(10, 10);
    expect(anvilPixel).toEqual(initial);
  });

  it('should sync buffer when setBuffer is called', () => {
    const initial: RGBAColor = [100, 150, 200, 255];
    const newColor: RGBAColor = [255, 0, 0, 255];
    const initialBuf = makeBuffer(W, H, initial);
    const newBuf = makeBuffer(W, H, newColor);

    const anvil = anvilManager.registerAnvil('L1', initialBuf, W, H);

    // Verify initial state
    expect(anvil.getPixel(10, 10)).toEqual(initial);

    anvil.replaceBuffer(newBuf);

    // Verify anvil was synced
    expect(anvil.getPixel(10, 10)).toEqual(newColor);
  });

  it('should handle resize operations', () => {
    const initial: RGBAColor = [100, 150, 200, 255];
    const buf = makeBuffer(W, H, initial);

    const anvil = anvilManager.registerAnvil('L1', buf, W, H);

    // Resize to larger dimensions
    const newW = W * 2;
    const newH = H * 2;

    anvil.resize(newW, newH);

    // Verify anvil was resized
    expect(anvil.getWidth()).toBe(newW);
    expect(anvil.getHeight()).toBe(newH);
  });

  it('should maintain separate anvil instances per layer', () => {
    const color1: RGBAColor = [255, 0, 0, 255];
    const color2: RGBAColor = [0, 255, 0, 255];
    const buf1 = makeBuffer(W, H, color1);
    const buf2 = makeBuffer(W, H, color2);

    const anvil1 = anvilManager.registerAnvil('L1', buf1, W, H);
    const anvil2 = anvilManager.registerAnvil('L2', buf2, W, H);

    expect(anvil1).not.toBe(anvil2);
    expect(anvil1.getPixel(10, 10)).toEqual(color1);
    expect(anvil2.getPixel(10, 10)).toEqual(color2);
  });

  it('should handle basic pixel operations through anvil', () => {
    const initial: RGBAColor = [0, 0, 0, 0];
    const testColor: RGBAColor = [255, 128, 64, 255];
    const buf = makeBuffer(W, H, initial);

    const anvil = anvilManager.registerAnvil('L1', buf, W, H);

    // Test setting a pixel through anvil
    anvil.setPixel(20, 20, testColor);

    // Verify the pixel was set
    expect(anvil.getPixel(20, 20)).toEqual(testColor);
  });
});
