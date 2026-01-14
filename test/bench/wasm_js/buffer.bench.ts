import { bench, describe } from 'vitest';

import { create_opacity_mask, flip_pixels_vertically, setWasmImplementation } from '~/utils/wasm';

type ImplKind = 'wasm' | 'js';

const WIDTH_4K = 3840;
const HEIGHT_4K = 2160;
const WIDTH_8K = 7680;
const HEIGHT_8K = 4320;

const seedBuffer = (len: number) => {
  const out = new Uint8Array(len);
  let x = 123456789;
  for (let i = 0; i < len; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    out[i] = x & 0xff;
  }
  return out;
};

const baseRaw4k = seedBuffer(WIDTH_4K * HEIGHT_4K * 4);
const baseRaw8k = seedBuffer(WIDTH_8K * HEIGHT_8K * 4);

// Tasks (bench only; results are not important)
// - Flip 4K and 8K buffers.
// - Create opacity masks for 4K and 8K buffers.
const tasks = {
  flip_4k: () => {
    flip_pixels_vertically(baseRaw4k, WIDTH_4K, HEIGHT_4K);
  },
  flip_8k: () => {
    flip_pixels_vertically(baseRaw8k, WIDTH_8K, HEIGHT_8K);
  },
  opacity_mask_4k: () => {
    create_opacity_mask(baseRaw4k, WIDTH_4K, HEIGHT_4K);
  },
  opacity_mask_8k: () => {
    create_opacity_mask(baseRaw8k, WIDTH_8K, HEIGHT_8K);
  },
};

const run = (impl: ImplKind, task: () => void): void => {
  setWasmImplementation(impl);
  task();
};

const entries = Object.entries(tasks) as Array<[keyof typeof tasks, () => void]>;

for (const [taskName, task] of entries) {
  describe(`buffer:${taskName}`, () => {
    bench('wasm', () => run('wasm', task));
    bench('js', () => run('js', task));
  });
}
