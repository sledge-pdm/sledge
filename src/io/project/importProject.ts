import { path } from '@tauri-apps/api';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { loadStoreFromProjectJson } from '~/stores/ProjectStores';

export async function importProjectFromFileSelection(): Promise<string | undefined> {
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

  const jsonText = await readTextFile(file);
  const projectJson = JSON.parse(jsonText);

  await importProjectJsonFromPath(projectJson);

  return file;
}

export async function importProjectFromPath(filePath: string) {
  if (!filePath) {
    console.log('file not selected');
    return;
  }
  const jsonText = await readTextFile(filePath);
  const projectJson = JSON.parse(jsonText);

  await loadStoreFromProjectJson(projectJson);
}

export async function importProjectJsonFromPath(filePath: string) {
  if (!filePath) {
    console.log('file not selected');
    return;
  }
  const jsonText = await readTextFile(filePath);
  const projectJson = JSON.parse(jsonText);

  return projectJson;
}
