import { bench, describe } from 'vitest';

import { fill_mask_area, scanline_flood_fill, scanline_flood_fill_with_mask, setWasmImplementation } from '~/utils/wasm';

type ImplKind = 'wasm' | 'js';

const WIDTH = 1024;
const HEIGHT = 1024;

const makeUniformBuffer = (width: number, height: number, r: number, g: number, b: number, a: number) => {
  const buf = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = a;
  }
  return buf;
};

const makeRectMask = (width: number, height: number, padding: number) => {
  const mask = new Uint8Array(width * height);
  const left = Math.max(0, padding);
  const right = Math.max(left, width - padding);
  for (let y = Math.max(0, padding); y < height - padding; y++) {
    mask.fill(1, y * width + left, y * width + right);
  }
  return mask;
};

const baseFillBuffer = new Uint8Array(WIDTH * HEIGHT * 4);
const baseFloodBuffer = makeUniformBuffer(WIDTH, HEIGHT, 10, 10, 10, 255);
const selectionMask = makeRectMask(WIDTH, HEIGHT, 128);

// Tasks (bench only; results are not important)
// - fill_mask_area on a 1K mask.
// - scanline_flood_fill on a 1K buffer.
// - scanline_flood_fill_with_mask on a 1K buffer.
const tasks = {
  fill_mask_area_1k: () => {
    const buffer = baseFillBuffer.slice();
    fill_mask_area(buffer, selectionMask, 20, 30, 40, 255);
  },
  flood_fill_1k: () => {
    const buffer = baseFloodBuffer.slice();
    scanline_flood_fill(buffer, WIDTH, HEIGHT, 512, 512, 2, 3, 4, 255, 0);
  },
  flood_fill_masked_1k: () => {
    const buffer = baseFloodBuffer.slice();
    scanline_flood_fill_with_mask(buffer, WIDTH, HEIGHT, 512, 512, 2, 3, 4, 255, 0, selectionMask, 'inside');
  },
};

const run = (impl: ImplKind, task: () => void): void => {
  setWasmImplementation(impl);
  task();
};

const entries = Object.entries(tasks) as Array<[keyof typeof tasks, () => void]>;

for (const [taskName, task] of entries) {
  describe(`fill:${taskName}`, () => {
    bench('wasm', () => run('wasm', task));
    bench('js', () => run('js', task));
  });
}
