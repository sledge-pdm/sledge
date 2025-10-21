import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImagePoolEntryPropsHistoryAction } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry, removeEntry } from '~/features/image_pool';

describe('ImagePoolEntryPropsHistoryAction', () => {
  const id = 'ip-1';
  const entry: ImagePoolEntry = {
    id,
    originalPath: 'C:/img.png',
    resourcePath: 'C:/img.png',
    fileName: 'img.png',
    base: { width: 10, height: 10 },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    opacity: 1,
    visible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // reset state
    if (getEntry(id)) removeEntry(id);
    insertEntry(entry);
  });

  it('redo applies new props and undo restores old props', () => {
    const oldProps = { ...entry, id: undefined as any } as any;
    const newProps = {
      ...oldProps,
      transform: { x: 5, y: 7, scaleX: 2, scaleY: 2 },
      opacity: 0.6,
      visible: false,
    };
    const action = new ImagePoolEntryPropsHistoryAction({ entryId: id, oldEntryProps: oldProps, newEntryProps: newProps, context: 'test' });

    action.redo();
    let e = getEntry(id)!;
    expect(e.transform.x).toBe(5);
    expect(e.transform.y).toBe(7);
    expect(e.transform.scaleX).toBe(2);
    expect(e.transform.scaleY).toBe(2);
    expect(e.opacity).toBe(0.6);
    expect(e.visible).toBe(false);

    action.undo();
    e = getEntry(id)!;
    expect(e.transform.x).toBe(0);
    expect(e.transform.y).toBe(0);
    expect(e.transform.scaleX).toBe(1);
    expect(e.transform.scaleY).toBe(1);
    expect(e.opacity).toBe(1);
    expect(e.visible).toBe(true);
  });
});
