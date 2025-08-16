import { BaseDirectory } from '@tauri-apps/api/path';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { saveGlobalSettings } from '~/io/config/save';
import { getDefaultSettings } from '~/io/config/set';
import { Consts } from '~/models/Consts';
import { loadConfigToGlobalStore } from '~/stores/GlobalStores';

export async function loadGlobalSettings() {
  const isConfigExists = await exists(Consts.globalConfigFileName, { baseDir: BaseDirectory.AppConfig });
  if (!isConfigExists) {
    console.warn('No global settings found, create one with default values.');
    const defaultSettings = await getDefaultSettings();
    await loadConfigToGlobalStore(defaultSettings);
    await saveGlobalSettings(false);
    return defaultSettings;
  } else {
    const configData = await readTextFile(Consts.globalConfigFileName, {
      baseDir: BaseDirectory.AppConfig,
    });

    let configJson;

    try {
      configJson = JSON.parse(configData);
      console.log('json data loaded from file:', configJson);
    } catch (e) {
      console.error('Failed to parse config JSON:', e);
    }

    if (!configJson) {
      console.warn('create config with default values.');
      const defaultSettings = await getDefaultSettings();
      await loadConfigToGlobalStore(defaultSettings);
      await saveGlobalSettings(false);
      return defaultSettings;
    } else {
      await loadConfigToGlobalStore(configJson);
      return configJson;
    }
  }
}
