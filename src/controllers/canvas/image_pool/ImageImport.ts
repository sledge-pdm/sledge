import { path } from '@tauri-apps/api';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';

export const importableImageExtensions = ['png', 'jpg', 'webp', 'gif'];

export async function openImageImportDialog(): Promise<string | string[] | undefined> {
  const origin = await path.pictureDir();
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
    console.log('file not selected');
    return undefined;
  }
  return file;
}
