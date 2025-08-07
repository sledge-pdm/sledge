import { BaseDirectory, writeTextFile } from '@tauri-apps/plugin-fs';
import { getDefaultSettings } from '~/io/config/set';
import { Consts } from '~/models/Consts';

export async function resetToDefaultConfig() {
  try {
    const defaultConfig = getDefaultSettings();
    await writeTextFile(Consts.globalConfigFileName, JSON.stringify(defaultConfig), {
      baseDir: BaseDirectory.AppConfig,
    });

    console.log('global settings reset done.');
  } catch (e) {
    console.error('global settings reset failed.', e);
    throw e;
  }
}
