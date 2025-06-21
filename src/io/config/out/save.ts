import { BaseDirectory, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/models/Consts';
import { getGlobalRootStore } from '~/stores/GlobalStores';

export async function saveGlobalSettings() {
  try {
    const json = JSON.stringify(getGlobalRootStore());
    console.log(json);
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    await writeTextFile(Consts.globalConfigFileName, json, { baseDir: BaseDirectory.AppConfig });
    console.log('global settings save done.');
  } catch (e) {
    console.error('global settings save failed.', e);
  }
}
