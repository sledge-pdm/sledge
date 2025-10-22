import { path } from '@tauri-apps/api';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { normalizeJoin } from '~/utils/FileUtils';

export async function openNewFile(): Promise<string | undefined> {
  const home = await path.homeDir();
  const file = await dialogOpen({
    multiple: false,
    directory: false,
    defaultPath: normalizeJoin(home, 'sledge'),
    filters: [
      {
        name: 'all files.',
        extensions: ['sledge', ...importableFileExtensions],
      },
      {
        name: 'sledge files.',
        extensions: ['sledge'],
      },
      {
        name: 'image files.',
        extensions: [...importableFileExtensions],
      },
    ],
  });

  if (!file) {
    console.log('file not selected');
    return undefined;
  }

  return file;
}
