import { describe, expect, it } from 'vitest';
import SelectionMask from '~/features/selection/SelectionMask';

describe('SelectionMask', () => {
  it('selectAll sets the bounding box to the full size', () => {
    const mask = new SelectionMask(3, 2);
    mask.selectAll();

    expect(mask.getBoundBox()).toEqual({ left: 0, right: 2, top: 0, bottom: 1 });
    expect(mask.isCleared()).toBe(false);
  });

  it('clear resets to an empty state', () => {
    const mask = new SelectionMask(2, 2);
    mask.selectAll();
    mask.clear();

    expect(mask.getBoundBox()).toBeUndefined();
    expect(mask.isCleared()).toBe(true);
  });
});
