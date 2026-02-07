import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openImageImportDialog } from '~/features/io/image_pool/import';
import { setIOStore, setLastSettingsStore } from '~/stores/EditorStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

describe('io/image_pool/import', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    setIOStore('savedLocation', { path: 'C:/projects', name: 'sample.sledge' });
    setLastSettingsStore('exportSettings', {
      folderPath: undefined,
      fileName: undefined,
      exportOptions: { perLayer: false, format: 'png', quality: 1, scale: 1 },
      showDirAfterSave: false,
    });
  });

  it('opens dialog with import filters and returns selected files', async () => {
    const open = vi.fn(async (_options: unknown) => ['C:/img/a.png', 'C:/img/b.webp']);
    platform.dialog.open = open as any;

    const result = await openImageImportDialog();

    expect(result).toEqual(['C:/img/a.png', 'C:/img/b.webp']);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: 'image files', extensions: ['png', 'jpg', 'webp', 'gif'] }],
      })
    );
  });

  it('returns undefined when user cancels dialog', async () => {
    const open = vi.fn(async () => null);
    platform.dialog.open = open as any;

    const result = await openImageImportDialog();

    expect(result).toBeUndefined();
  });
});
