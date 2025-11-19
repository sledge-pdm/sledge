import { BaseDirectory } from '@tauri-apps/api/path';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { saveGlobalSettings } from '~/features/io/config/save';
import { getDefaultSettings } from '~/features/io/config/set';
import { logSystemError, logSystemInfo, logSystemWarn } from '~/features/log/service';
import { loadConfigToGlobalStore } from '~/stores/GlobalStores';

const LOG_LABEL = 'ConfigLoader';

export async function loadGlobalSettings() {
  const isConfigExists = await exists(Consts.globalConfigFileName, { baseDir: BaseDirectory.AppConfig });
  const defaultSettings = getDefaultSettings();
  if (!isConfigExists) {
    logSystemWarn('No global settings found, create one with default values.', { label: LOG_LABEL });
    loadConfigToGlobalStore(defaultSettings);
    await saveGlobalSettings(false);
    return defaultSettings;
  } else {
    const configData = await readTextFile(Consts.globalConfigFileName, {
      baseDir: BaseDirectory.AppConfig,
    });

    let configJson;

    try {
      configJson = JSON.parse(configData);
      logSystemInfo('json data loaded from file.', { label: LOG_LABEL, debugOnly: true });
    } catch (e) {
      logSystemError('Failed to parse config JSON.', { label: LOG_LABEL, details: [e] });
    }

    if (!configJson) {
      logSystemWarn('create config with default values.', { label: LOG_LABEL });
      loadConfigToGlobalStore(defaultSettings);
      await saveGlobalSettings(false);
      return defaultSettings;
    } else {
      const fallbackedConfigJson = {
        ...defaultSettings,
        ...configJson,
      };
      loadConfigToGlobalStore(fallbackedConfigJson);
      await saveGlobalSettings(false);
      return fallbackedConfigJson;
    }
  }
}
