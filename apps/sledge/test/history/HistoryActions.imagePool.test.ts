import { beforeEach, describe, it } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { getEntry, insertEntry, removeEntry } from '~/features/image_pool';
import './mocks';
import { createTestEntry, expect, expectHistoryState, setupTestEnvironment } from './utils';

describe('ImagePoolHistoryAction', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('undo/redo add/remove keeps id with insertEntry()', async () => {
    const entry = createTestEntry('entry-A', {
      originalPath: 'C:/dummy.png',
    });

    insertEntry(entry, true); 
    removeEntry(entry.id, false);
    expect(getEntry('entry-A')).toBeUndefined();

    expectHistoryState(true, false);
    projectHistoryController.undo();
    expect(getEntry('entry-A')).toBeDefined();

    expectHistoryState(false, true);
    projectHistoryController.redo();
    expect(getEntry('entry-A')).toBeUndefined();

    // cleanup
    removeEntry('entry-A');
  });
});
