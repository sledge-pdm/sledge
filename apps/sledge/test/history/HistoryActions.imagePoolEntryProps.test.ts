import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectHistoryController } from '~/features/history';
import { getEntry, ImagePoolEntry, insertEntry, updateEntryPartial } from '~/features/image_pool';
import { setImagePoolStore } from '~/stores/ProjectStores';

describe('ImagePoolEntryPropsHistoryAction', () => {
  const id = 'ip-1';
  const entry: ImagePoolEntry = {
    id,
    imagePath: 'C:/img.png',
    base: { width: 10, height: 10 },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    opacity: 1,
    visible: true,
  };

  const hc = projectHistoryController;

  beforeEach(() => {
    vi.clearAllMocks();
    hc.clearHistory();
    setImagePoolStore('entries', []);
    setImagePoolStore('selectedEntryId', undefined);
    // Initialize with the entry
    insertEntry(entry, true); // noDiff=true to avoid history during setup
  });

  it('redo applies new props and undo restores old props', () => {
    const newProps = {
      transform: { x: 5, y: 7, scaleX: 2, scaleY: 2 },
      opacity: 0.6,
      visible: false,
    };

    // Apply changes (this should add to history)
    updateEntryPartial(id, newProps);

    let e = getEntry(id)!;
    expect(e.transform.x).toBe(5);
    expect(e.transform.y).toBe(7);
    expect(e.transform.scaleX).toBe(2);
    expect(e.transform.scaleY).toBe(2);
    expect(e.opacity).toBe(0.6);
    expect(e.visible).toBe(false);

    // Undo should restore original values
    hc.undo();
    e = getEntry(id)!;
    expect(e.transform.x).toBe(0);
    expect(e.transform.y).toBe(0);
    expect(e.transform.scaleX).toBe(1);
    expect(e.transform.scaleY).toBe(1);
    expect(e.opacity).toBe(1);
    expect(e.visible).toBe(true);
  });
});
