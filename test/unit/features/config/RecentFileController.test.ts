import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('~/features/io/editor/save', () => ({
  saveEditorStateDebounced: vi.fn(),
}));

import { addRecentFile } from '~/features/config/RecentFileController';
import { saveEditorStateDebounced } from '~/features/io/editor/save';
import { ioStore, setIOStore } from '~/stores/EditorStores';

describe('RecentFileController', () => {
  beforeEach(() => {
    setIOStore('recentFiles', []);
    vi.mocked(saveEditorStateDebounced).mockClear();
  });

  it('appends a recent file and triggers save', () => {
    addRecentFile({ path: 'C:/a', name: 'a.sledge' });

    expect(ioStore.recentFiles).toEqual([{ path: 'C:/a', name: 'a.sledge' }]);
    expect(saveEditorStateDebounced).toHaveBeenCalledTimes(1);
  });

  it('moves duplicate recent file to the tail', () => {
    setIOStore('recentFiles', [
      { path: 'C:/a', name: 'a.sledge' },
      { path: 'C:/b', name: 'b.sledge' },
    ]);

    addRecentFile({ path: 'C:/a', name: 'a.sledge' });

    expect(ioStore.recentFiles).toEqual([
      { path: 'C:/b', name: 'b.sledge' },
      { path: 'C:/a', name: 'a.sledge' },
    ]);
  });

  it('ignores undefined location', () => {
    addRecentFile(undefined);

    expect(ioStore.recentFiles).toEqual([]);
    expect(saveEditorStateDebounced).not.toHaveBeenCalled();
  });
});
