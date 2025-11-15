import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';
import { applyProjectLocationFromPath } from '~/features/io/project/ProjectLocationManager';

export function setSavedLocation(path: string) {
  applyProjectLocationFromPath(path, 'project');
}

// make app config path (%APPDATA%/Roaming/com.innsbluck.sledge/) if not exists
export async function ensureAppConfigPath() {
  if (!(await exists('', { baseDir: BaseDirectory.AppConfig }))) {
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
  }
}
