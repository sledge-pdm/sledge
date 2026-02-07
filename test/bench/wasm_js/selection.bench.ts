import { bench, describe } from 'vitest';

import {
  apply_mask_offset,
  combine_masks_add,
  fill_lasso_selection,
  fill_rect_mask,
  mask_to_path,
  setWasmImplementation,
  trim_mask_with_box,
} from '~/utils/wasm';

type ImplKind = 'wasm' | 'js';

const selectionWidth = 512;
const selectionHeight = 512;
const lassoPoints = new Float32Array([30, 30, 220, 40, 210, 150, 40, 160]);

const heavyWidth = 1024;
const heavyHeight = 1024;
const heavyTrimWidth = 896;
const heavyTrimHeight = 896;
const heavyLassoPoints = new Float32Array(1024 * 2);
for (let i = 0; i < 1024; i++) {
  const t = (i / 1024) * Math.PI * 2;
  const x = 448 + Math.cos(t) * 320;
  const y = 448 + Math.sin(t) * 320;
  heavyLassoPoints[i * 2] = x;
  heavyLassoPoints[i * 2 + 1] = y;
}

// Tasks (bench only; results are not important)
// - Selection basic pipeline (rect fill -> offset -> combine -> trim -> lasso -> path).
// - Selection heavy pipeline with dense lasso points.
const tasks = {
  basic: () => {
    const selectionMask = new Uint8Array(selectionWidth * selectionHeight);
    fill_rect_mask(selectionMask, selectionWidth, selectionHeight, 128, 128, 200, 160);
    const offset = apply_mask_offset(selectionMask, selectionWidth, selectionHeight, 7, -3);
    const combined = combine_masks_add(selectionMask, offset);
    const trimmed = trim_mask_with_box(combined, selectionWidth, selectionHeight, 96, 96, 256, 192);
    fill_lasso_selection(trimmed, 256, 192, lassoPoints, 'evenodd');
    mask_to_path(trimmed, 256, 192, 0, 0);
  },
  heavy: () => {
    const selectionMask = new Uint8Array(heavyWidth * heavyHeight);
    fill_rect_mask(selectionMask, heavyWidth, heavyHeight, 128, 128, 512, 512);
    const offset = apply_mask_offset(selectionMask, heavyWidth, heavyHeight, 11, -9);
    const combined = combine_masks_add(selectionMask, offset);
    const trimmed = trim_mask_with_box(combined, heavyWidth, heavyHeight, 64, 64, heavyTrimWidth, heavyTrimHeight);
    fill_lasso_selection(trimmed, heavyTrimWidth, heavyTrimHeight, heavyLassoPoints, 'evenodd');
    mask_to_path(trimmed, heavyTrimWidth, heavyTrimHeight, 0, 0);
  },
};

const run = (impl: ImplKind, task: () => void): void => {
  setWasmImplementation(impl);
  task();
};

const entries = Object.entries(tasks) as Array<[keyof typeof tasks, () => void]>;

for (const [taskName, task] of entries) {
  describe(`selection:${taskName}`, () => {
    bench('wasm', () => run('wasm', task));
    bench('js', () => run('js', task));
  });
}
