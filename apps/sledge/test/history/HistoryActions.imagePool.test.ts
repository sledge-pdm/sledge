import { describe, expect, it } from 'vitest';
import { ImagePoolHistoryAction } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry, removeEntry } from '~/features/image_pool';

describe('ImagePoolHistoryAction', () => {
  it('undo/redo add/remove keeps id with insertEntry()', async () => {
    const entry: ImagePoolEntry = {
      id: 'fixed-id',
      originalPath: 'C:/dummy.png',
      resourcePath: 'C:/dummy.png',
      fileName: 'dummy.png',
      base: { width: 10, height: 10 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      opacity: 1,
      visible: true,
    };
    insertEntry(entry);
    const removeAction = new ImagePoolHistoryAction('remove', entry, { from: 'test' });
    removeAction.redo();
    expect(getEntry('fixed-id')).toBeUndefined();
    removeAction.undo();
    expect(getEntry('fixed-id')).toBeDefined();

    const addAction = new ImagePoolHistoryAction('add', entry, { from: 'test' });
    addAction.undo();
    expect(getEntry('fixed-id')).toBeUndefined();
    addAction.redo();
    expect(getEntry('fixed-id')).toBeDefined();

    // cleanup
    removeEntry('fixed-id');
  });
});
