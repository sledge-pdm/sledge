import { beforeEach, describe, expect, it } from 'vitest';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';

const buildMask = (width: number, height: number, points: Array<{ x: number; y: number }>) => {
  const mask = new SelectionMask(width, height);
  for (const p of points) {
    mask.setFlag(p, 1);
  }
  return mask;
};

describe('SelectionManager', () => {
  beforeEach(() => {
    selectionManager.clearAll();
  });

  it('prefers front selection over back selection', () => {
    const back = buildMask(4, 4, [{ x: 0, y: 0 }]);
    const front = buildMask(4, 4, [{ x: 1, y: 1 }]);

    selectionManager.setBack(back);
    selectionManager.setFront(front);

    expect(selectionManager.getSelection()).toBe(front);
  });

  it('commitOffset moves current mask and clears offset', () => {
    const back = buildMask(3, 3, [{ x: 1, y: 1 }]);
    selectionManager.setBack(back);
    selectionManager.setOffset({ x: 1, y: -1 });

    selectionManager.commitOffset();

    const moved = selectionManager.getBack();
    const raw = moved?.getMask();
    expect(raw?.[0 * 3 + 2]).toBe(1);
    expect(selectionManager.getOffset()).toEqual({ x: 0, y: 0 });
  });

  it('applyFrontToBack commits preview selection', () => {
    const front = buildMask(3, 3, [{ x: 2, y: 2 }]);
    selectionManager.setFront(front);

    selectionManager.applyFrontToBack();

    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()).toBe(front);
  });

  it('resize updates masks and resets offset', () => {
    const back = buildMask(2, 2, [{ x: 1, y: 1 }]);
    selectionManager.setBack(back);
    selectionManager.setOffset({ x: 3, y: 4 });

    selectionManager.resize({ width: 4, height: 3 });

    expect(selectionManager.getBack()?.getWidth()).toBe(4);
    expect(selectionManager.getBack()?.getHeight()).toBe(3);
    expect(selectionManager.getOffset()).toEqual({ x: 0, y: 0 });
  });

  it('clearFront, clearBack and clearAll clear selection state', () => {
    const back = buildMask(2, 2, [{ x: 0, y: 0 }]);
    const front = buildMask(2, 2, [{ x: 1, y: 1 }]);
    selectionManager.setBack(back);
    selectionManager.setFront(front);
    selectionManager.setOffset({ x: 1, y: 1 });

    selectionManager.clearFront();
    expect(selectionManager.getFront()).toBeUndefined();
    expect(selectionManager.getBack()).toBe(back);
    expect(selectionManager.getOffset()).toEqual({ x: 0, y: 0 });

    selectionManager.clearBack();
    expect(selectionManager.getBack()).toBeUndefined();

    selectionManager.setBack(back);
    selectionManager.clearAll();
    expect(selectionManager.getBack()).toBeUndefined();
    expect(selectionManager.getFront()).toBeUndefined();
  });
});
