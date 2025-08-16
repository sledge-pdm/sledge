import { saveGlobalSettings } from '~/io/config/save';
import { getDefaultSettings } from '~/io/config/set';
import { loadConfigToGlobalStore } from '~/stores/GlobalStores';

export async function resetToDefaultConfig() {
  try {
    const defaultConfig = getDefaultSettings();
    loadConfigToGlobalStore(defaultConfig);
    await saveGlobalSettings(true);

    console.log('global settings reset done.');
  } catch (e) {
    console.error('global settings reset failed.', e);
    throw e;
  }
}
