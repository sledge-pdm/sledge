import { GlobalConfig } from '~/features/config/models/GlobalConfig';
import { KeyConfigStore, LastSettingsStore } from '~/stores/GlobalStores';

// config json saved to config.json
export interface Config {
  globalConfigStore: GlobalConfig;
  keyConfigStore: KeyConfigStore;
  lastSettingsStore: LastSettingsStore;
}
