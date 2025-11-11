import { beforeEach, describe, it } from 'vitest';
import { CanvasSizeHistoryAction } from '~/features/history';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import './mocks';
import { expect, setupTestAnvil, setupTestEnvironment, TEST_CONSTANTS } from './utils';

describe('CanvasSizeHistoryAction', () => {
  beforeEach(() => {
    setupTestEnvironment();
    allLayers().forEach((l) => {
      setupTestAnvil(l.id, TEST_CONSTANTS.CANVAS_SIZE.width, TEST_CONSTANTS.CANVAS_SIZE.height, TEST_CONSTANTS.TILE_SIZE);
    });
  });

  it('undo/redo updates canvas size value', () => {
    const oldSize = { width: 100, height: 80 } as const;
    const newSize = { width: 120, height: 90 } as const;
    const action = new CanvasSizeHistoryAction({
      beforeSize: oldSize,
      afterSize: newSize,
      context: { from: TEST_CONSTANTS.CONTEXT },
    });

    // redoing CanvasSizeHistoryActions no longer means apply resizing.
    // Instead, use registerBefore/registerAfter pattern
    action.registerBefore();

    setCanvasStore('canvas', newSize);
    allLayers().forEach((l) => getAnvilOf(l.id)?.resize(newSize.width, newSize.height));

    action.registerAfter();

    expect(canvasStore.canvas.width).toBe(newSize.width);
    expect(canvasStore.canvas.height).toBe(newSize.height);

    action.undo();
    expect(canvasStore.canvas.width).toBe(oldSize.width);
    expect(canvasStore.canvas.height).toBe(oldSize.height);
  });
});
