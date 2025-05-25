import { path } from '@tauri-apps/api';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';

export async function openProjectFile(): Promise<string | undefined> {
  const home = await path.homeDir();
  const file = await dialogOpen({
    multiple: false,
    directory: false,
    defaultPath: await path.join(home, 'sledge'),
    filters: [
      {
        name: 'sledge files',
        extensions: ['sledge'],
      },
    ],
  });

  if (!file) {
    console.log('file not selected');
    return undefined;
  }

  return file;
}
