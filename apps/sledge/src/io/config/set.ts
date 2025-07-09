import { defaultConfig } from '~/models/config/GlobalConfig';
import { defaultLastSettingsStore, loadGlobalStore, makeDefaultKeyConfigStore } from '~/stores/GlobalStores';

export default async function setGlobalSettings(data: any) {
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
}
