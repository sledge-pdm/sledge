import { beforeEach, describe, expect, it } from 'vitest';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { computeMaskBBox, isDrawingAllowed } from '~/features/selection/service';
import { setToolStore } from '~/stores/EditorStores';

describe('selection service', () => {
  beforeEach(() => {
    selectionManager.clearAll();
    setToolStore('selectionLimitMode', 'inside');
  });

  it('computeMaskBBox returns undefined when mask has no selected pixels', () => {
    const mask = new Uint8Array(12);
    expect(computeMaskBBox(mask, 4, 3)).toBeUndefined();
  });

  it('computeMaskBBox returns tight bounding box for selected region', () => {
    const width = 5;
    const height = 4;
    const mask = new Uint8Array(width * height);
    mask[1 * width + 2] = 1;
    mask[2 * width + 4] = 1;
    mask[3 * width + 3] = 1;

    expect(computeMaskBBox(mask, width, height)).toEqual({
      x: 2,
      y: 1,
      width: 3,
      height: 3,
    });
  });

  it('isDrawingAllowed allows drawing when mode is none and no state check', () => {
    setToolStore('selectionLimitMode', 'none');
    expect(isDrawingAllowed({ x: 100, y: 100 }, true)).toBe(true);
  });

  it('isDrawingAllowed respects inside/outside mode when selection exists', () => {
    const selection = new SelectionMask(4, 4);
    selection.setFlag({ x: 1, y: 1 }, 1);
    selectionManager.setBack(selection);

    setToolStore('selectionLimitMode', 'inside');
    expect(isDrawingAllowed({ x: 1, y: 1 })).toBe(true);
    expect(isDrawingAllowed({ x: 0, y: 0 })).toBe(false);

    setToolStore('selectionLimitMode', 'outside');
    expect(isDrawingAllowed({ x: 1, y: 1 })).toBe(false);
    expect(isDrawingAllowed({ x: 0, y: 0 })).toBe(true);
  });
});
