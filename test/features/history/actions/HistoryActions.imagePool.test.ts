import { beforeEach, describe, it } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { getEntry, insertEntry, removeEntry } from '~/features/image_pool';
import { HistoryActionTester } from '../../../support/HistoryActionTester';
import { projectFixture } from '../../../support/projectFixture';
import '../mocks';
import { createTestEntry, createTestLayer, expect, expectHistoryState } from '../utils';

describe('ImagePoolHistoryAction', () => {
  beforeEach(() => {
    projectFixture()
      .withCanvas({ width: 32, height: 32 })
      .withLayers([createTestLayer('A')])
      .withActiveLayer('A')
      .clearHistory(true)
      .apply();
  });

  it('undo/redo add/remove keeps id with insertEntry()', async () => {
    const entry = createTestEntry('entry-A', {
      originalPath: 'C:/dummy.png',
    });

    const tester = new HistoryActionTester(
      () =>
        new ImagePoolHistoryAction({
          kind: 'add',
          oldEntries: [],
          newEntries: [entry],
          context: { from: 'test' },
        })
    );

    tester.run({
      apply: (action) => {
        insertEntry(entry, true); // ユーザー操作で追加（履歴なし）
        projectHistoryController.addAction(action);
        expectHistoryState(true, false);
      },
      undo: () => projectHistoryController.undo(),
      redo: () => projectHistoryController.redo(),
      assertAfterApply: () => expect(getEntry('entry-A')).toBeDefined(),
      assertAfterUndo: () => {
        expect(getEntry('entry-A')).toBeUndefined();
        expectHistoryState(false, true);
      },
      assertAfterRedo: () => {
        expect(getEntry('entry-A')).toBeDefined();
        expectHistoryState(true, false);
      },
    });

    // cleanup
    removeEntry('entry-A', true);
  });
});
