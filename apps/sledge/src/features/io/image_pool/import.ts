import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { logUserWarn } from '~/features/log/service';
import { exportDir } from '~/utils/FileUtils';

export const importableImageExtensions = ['png', 'jpg', 'webp', 'gif'];

export async function openImageImportDialog(): Promise<string | string[] | undefined> {
  const origin = await exportDir();
  const file = await dialogOpen({
    multiple: true,
    directory: false,
    defaultPath: origin,
    filters: [
      {
        name: 'image files',
        extensions: importableImageExtensions,
      },
    ],
  });

  if (!file) {
    logUserWarn('file not selected.', { label: 'ImagePoolImport' });
    return undefined;
  }
  return file;
}
