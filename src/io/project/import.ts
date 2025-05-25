import { readTextFile } from '@tauri-apps/plugin-fs';
import { loadProjectJson } from '~/io/project/load';

// called when projectstore load
export async function importProjectFromPath(filePath: string) {
  if (!filePath) {
    console.log('file not selected');
    return;
  }
  const jsonText = await readTextFile(filePath);

  loadProjectJson(jsonText);
}
