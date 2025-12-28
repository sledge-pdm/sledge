import { saveGlobalSettings } from '~/features/io/config/save';
import { getDefaultSettings } from '~/features/io/config/set';
import { logSystemError } from '~/features/log/service';
import { loadConfigToGlobalStore } from '~/stores/GlobalStores';

export async function resetToDefaultConfig() {
  try {
    const defaultConfig = getDefaultSettings();
    loadConfigToGlobalStore(defaultConfig);
    await saveGlobalSettings(true);
  } catch (e) {
    logSystemError('global settings reset failed.', { label: 'ConfigReset', details: [e] });
    throw e;
  }
}
