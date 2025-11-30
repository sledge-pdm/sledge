import { beforeEach, describe, it } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { GREEN, RED } from '../../../support/colors';
import { HistoryActionTester } from '../../../support/HistoryActionTester';
import { projectFixture } from '../../../support/projectFixture';
import '../mocks';
import { createTestLayer, expect, expectHistoryState, TEST_CONSTANTS } from '../utils';

describe('AnvilLayerHistoryAction', () => {
  const layerId = 'A';

  beforeEach(() => {
    projectFixture()
      .withCanvas(TEST_CONSTANTS.CANVAS_SIZE)
      .withLayers([createTestLayer(layerId)])
      .withActiveLayer(layerId)
      .useLayerAnvils(TEST_CONSTANTS.TILE_SIZE)
      .clearHistory(true)
      .apply();
  });

  it('undo/redo whole buffer change restores data', () => {
    const anvil = getAnvil(layerId);
    const before = anvil.getBufferCopy();
    const after = before.slice();
    after.fill(128);

    // Apply the change to the actual buffer first
    anvil.replaceBuffer(after);
    anvil.addWholeDiff(before);

    const patch = anvil.flushDiffs();
    expect(patch).not.toBeNull();

    const tester = new HistoryActionTester(
      () =>
        new AnvilLayerHistoryAction({
          layerId,
          patch: patch!,
        })
    );

    tester.run({
      apply: () => {
        // buffer is already in the "after" state from the manual replace above
      },
      assertAfterApply: () => expect(anvil.getBufferCopy()[0]).toBe(128),
      assertAfterUndo: () => {
        const reverted = anvil.getBufferCopy();
        expect(reverted[0]).toBe(before[0]);
      },
      assertAfterRedo: () => {
        const reApplied = anvil.getBufferCopy();
        expect(reApplied[0]).toBe(128);
      },
    });
  });

  it('pixel patch writes individual pixels and can be undone', () => {
    const anvil = getAnvil(layerId);
    const beforeCopy = anvil.getBufferCopy().slice();

    // Set pixels with different colors
    anvil.setPixel(1, 1, RED); // Red
    anvil.setPixel(2, 1, GREEN); // Green

    const patch = anvil.flushDiffs()!;

    const tester = new HistoryActionTester(
      () =>
        new AnvilLayerHistoryAction({
          layerId,
          patch,
        })
    );

    tester.run({
      apply: () => {
        // state already has pixels set and diff flushed
      },
      assertAfterApply: () => {
        expect(anvil.getPixel(1, 1)[0]).toBe(255);
      },
      assertAfterUndo: () => expect(anvil.getPixel(1, 1)[0]).toBe(beforeCopy[(1 + 1 * TEST_CONSTANTS.CANVAS_SIZE.width) * 4]),
      assertAfterRedo: () => expect(anvil.getPixel(2, 1)[1]).toBe(255),
    });
  });

  it('history controller pushes and undoes Anvil patches', () => {
    const anvil = getAnvil(layerId);
    anvil.setPixel(0, 0, [9, 9, 9, 255]);
    const patch = anvil.flushDiffs()!;

    const tester = new HistoryActionTester(
      () =>
        new AnvilLayerHistoryAction({
          layerId,
          patch,
        })
    );

    tester.run({
      apply: (action) => {
        projectHistoryController.addAction(action);
        expectHistoryState(true, false);
      },
      undo: () => projectHistoryController.undo(),
      redo: () => projectHistoryController.redo(),
      assertAfterUndo: () => expect(anvil.getPixel(0, 0)[3]).toBe(0), // alpha back to 0 after undo
      assertAfterRedo: () => {
        expect(anvil.getPixel(0, 0)[0]).toBe(9);
        expectHistoryState(true, false);
      },
    });
  });
});
