import { bench, describe } from 'vitest';

import { apply_mask_offset, combine_masks_add, fill_rect_mask, setWasmImplementation } from '~/utils/wasm';

type ImplKind = 'wasm' | 'js';

const seedMask = (width: number, height: number) => {
  const mask = new Uint8Array(width * height);
  fill_rect_mask(mask, width, height, 64, 64, width - 128, height - 128);
  return mask;
};

// Tasks (bench only; results are not important)
// - Allocation churn via repeated offset/combine on 1K and 2K masks.
const tasks = {
  alloc_1k: () => {
    const width = 1024;
    const height = 1024;
    let mask = seedMask(width, height);
    for (let i = 0; i < 24; i++) {
      const offset = apply_mask_offset(mask, width, height, (i % 7) - 3, (i % 5) - 2);
      mask = combine_masks_add(mask, offset) as Uint8Array<ArrayBuffer>;
    }
  },
  alloc_2k: () => {
    const width = 2048;
    const height = 2048;
    let mask = seedMask(width, height);
    for (let i = 0; i < 16; i++) {
      const offset = apply_mask_offset(mask, width, height, (i % 9) - 4, (i % 7) - 3);
      mask = combine_masks_add(mask, offset) as Uint8Array<ArrayBuffer>;
    }
  },
};

const run = (impl: ImplKind, task: () => void): void => {
  setWasmImplementation(impl);
  task();
};

const entries = Object.entries(tasks) as Array<[keyof typeof tasks, () => void]>;

for (const [taskName, task] of entries) {
  describe(`gc:${taskName}`, () => {
    bench('wasm', () => run('wasm', task));
    bench('js', () => run('js', task));
  });
}
