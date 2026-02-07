import { logUserWarn } from '~/features/log/service';
import { exportDir } from '~/utils/FileUtils';
import { dialog } from '~/utils/platform';

export const importableImageExtensions = ['png', 'jpg', 'webp', 'gif'];

export async function openImageImportDialog(): Promise<string | string[] | undefined> {
  const origin = await exportDir();
  const file = await dialog.open({
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
