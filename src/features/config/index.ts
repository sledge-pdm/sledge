import { applyProjectLocationFromPath } from '~/features/io/project/ProjectLocationManager';
import { fs } from '~/utils/platform';

export function setSavedLocation(path: string) {
  applyProjectLocationFromPath(path, 'project');
}

// make app config path (%APPDATA%/Roaming/com.innsbluck.sledge/) if not exists
export async function ensureAppConfigPath() {
  const baseDir = fs.BaseDirectory?.AppConfig;
  if (!baseDir) return;
  if (!(await fs.exists('', { baseDir }))) {
    await fs.mkdir('', { baseDir, recursive: true });
  }
}
