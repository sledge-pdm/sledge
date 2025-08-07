import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/models/Consts';
import { getGlobalRootStore } from '~/stores/GlobalStores';

export async function saveGlobalSettings() {
  try {
    const config = getGlobalRootStore();
    const configData = await writeTextFile(Consts.globalConfigFileName, JSON.stringify(config), {
      baseDir: BaseDirectory.AppConfig,
    });
    console.log('global settings save done (via Rust).');
  } catch (e) {
    console.error('global settings save failed (via Rust).', e);
    throw e;
  }
}
