import { describe, expect, it } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry, removeEntry } from '~/features/image_pool';

describe('ImagePoolHistoryAction', () => {
  it('undo/redo add/remove keeps id with insertEntry()', async () => {
    const entry: ImagePoolEntry = {
      id: 'fixed-id',
      imagePath: 'C:/dummy.png',
      base: { width: 10, height: 10 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      opacity: 1,
      visible: true,
    };
    insertEntry(entry);
    removeEntry(entry.id, false);
    expect(getEntry('fixed-id')).toBeUndefined();
    projectHistoryController.undo();
    expect(getEntry('fixed-id')).toBeDefined();
    projectHistoryController.redo();
    expect(getEntry('fixed-id')).toBeUndefined();

    // cleanup
    removeEntry('fixed-id');
  });
});
