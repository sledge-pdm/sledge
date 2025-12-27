import { beforeEach, describe, it } from 'vitest';
import { CanvasSizeHistoryAction } from '~/features/history';
import { allLayers } from '~/features/layer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, setCanvasStore } from '~/stores/ProjectStores';
import { HistoryActionTester } from '../../../support/HistoryActionTester';
import { projectFixture } from '../../../support/projectFixture';
import '../mocks';
import { createTestLayers, expect, TEST_CONSTANTS } from '../utils';

describe('CanvasSizeHistoryAction', () => {
  beforeEach(() => {
    projectFixture()
      .withCanvas(TEST_CONSTANTS.CANVAS_SIZE)
      .withLayers(createTestLayers(3))
      .withActiveLayer('A')
      .useLayerAnvils(TEST_CONSTANTS.TILE_SIZE)
      .clearHistory(true)
      .apply();
  });

  it('undo/redo updates canvas size value', () => {
    const oldSize = { width: 100, height: 80 } as const;
    const newSize = { width: 120, height: 90 } as const;
    const tester = new HistoryActionTester(
      () =>
        new CanvasSizeHistoryAction({
          beforeSize: oldSize,
          afterSize: newSize,
          context: { from: TEST_CONSTANTS.CONTEXT },
        })
    );

    tester.run({
      before: (action) => action.registerBefore(),
      apply: (action) => {
        setCanvasStore('canvas', newSize);
        allLayers().forEach((l) => getAnvil(l.id).resize(newSize.width, newSize.height));
        action.registerAfter();
      },
      assertAfterApply: () => expect(canvasStore.canvas).toHaveCanvasSize(newSize),
      assertAfterUndo: () => expect(canvasStore.canvas).toHaveCanvasSize(oldSize),
    });
  });
});
