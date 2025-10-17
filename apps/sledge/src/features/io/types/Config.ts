import { GlobalConfig } from '~/config/GlobalConfig';
import { KeyConfigStore } from '~/stores/global/KeyConfigStore';
import { LastSettingsStore } from '~/stores/global/LastSettingsStore';

// config json saved to config.json
export interface Config {
  globalConfigStore: GlobalConfig;
  keyConfigStore: KeyConfigStore;
  lastSettingsStore: LastSettingsStore;
}
