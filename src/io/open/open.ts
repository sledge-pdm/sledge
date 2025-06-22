import { path } from '@tauri-apps/api';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';

export async function openNewFile(): Promise<string | undefined> {
  const home = await path.homeDir();
  const file = await dialogOpen({
    multiple: false,
    directory: false,
    defaultPath: await path.join(home, 'sledge'),
    filters: [
      {
        name: 'all files.',
        extensions: ['sledge', 'jpg', 'png'],
      },
      {
        name: 'sledge files.',
        extensions: ['sledge'],
      },
      {
        name: 'image files.',
        extensions: ['jpg', 'png'],
      },
    ],
  });

  if (!file) {
    console.log('file not selected');
    return undefined;
  }

  return file;
}
