import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';
import { defaultConfig } from '~/models/config/GlobalConfig';
import { Consts } from '~/models/Consts';
import { defaultLastSettingsStore, loadGlobalStore, makeDefaultKeyConfigStore } from '~/stores/GlobalStores';

export default async function loadGlobalSettings() {
  try {
    const json = await readTextFile(Consts.globalConfigFileName, {
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
