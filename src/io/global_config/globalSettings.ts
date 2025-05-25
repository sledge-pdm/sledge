import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { defaultConfig } from '~/models/config/GlobalConfig';
import { defaultLastSettingsStore, getGlobalRootStore, initGlobalStore, loadGlobalStore, makeDefaultKeyConfigStore } from '~/stores/GlobalStores';

const FILE_NAME = 'global.sledgeconfig';

export async function saveGlobalSettings() {
  try {
    const json = JSON.stringify(getGlobalRootStore());
    console.log(json);
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    await writeTextFile(FILE_NAME, json, { baseDir: BaseDirectory.AppConfig });
    console.log('global settings save done.');
  } catch (e) {
    console.error('global settings save failed.', e);
  }
}

export async function resetToDefaultConfig() {
  try {
    const json = JSON.stringify(initGlobalStore());
    console.log(json);
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
    await writeTextFile(FILE_NAME, json, { baseDir: BaseDirectory.AppConfig });
    console.log('global settings save done.');
  } catch (e) {
    console.error('global settings save failed.', e);
  }
}

export async function loadGlobalSettings() {
  try {
    const json = await readTextFile(FILE_NAME, {
      baseDir: BaseDirectory.AppConfig,
    });
    const data = JSON.parse(json);

    loadGlobalStore(
      Object.assign(
        {
          globalConfigStore: defaultConfig,
          keyConfigStore: makeDefaultKeyConfigStore(),
          lastSettingsStore: defaultLastSettingsStore,
        },
        data
      )
    );

    console.log('global settings load done.', data);
  } catch (e) {
    console.log('global settings load failed.', e);
  }
}
