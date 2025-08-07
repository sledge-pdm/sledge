import { BaseDirectory } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { setGlobalSettings } from '~/io/config/set';
import { Consts } from '~/models/Consts';

export async function loadGlobalSettings() {
  const configData = await readTextFile(Consts.globalConfigFileName, {
    baseDir: BaseDirectory.AppConfig,
  });

  let configJson = JSON.parse(configData);
  console.log('json data loaded from file:', configJson);

  if (!configJson || Object.keys(configJson).length === 0) {
    console.warn('No global settings found, using default values.');
  }

  await setGlobalSettings(configJson);

  return configJson;
}
