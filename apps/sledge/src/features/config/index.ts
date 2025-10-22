import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';
import { setFileStore } from '~/stores/EditorStores';
import { pathToFileLocation } from '~/utils/FileUtils';

export function setSavedLocation(path: string) {
  const fileLocation = pathToFileLocation(path);
  if (!fileLocation) return;
  setFileStore('savedLocation', fileLocation);
}

// make app config path (%APPDATA%/Roaming/com.innsbluck.sledge/) if not exists
export async function ensureAppConfigPath() {
  if (!(await exists('', { baseDir: BaseDirectory.AppConfig }))) {
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
  }
}
