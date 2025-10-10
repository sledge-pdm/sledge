import { GlobalConfig } from '~/features/config/models/GlobalConfig';
import { KeyConfigStore, LastSettingsStore } from '~/stores/GlobalStores';

export interface SavingConfig {
  globalConfigStore: GlobalConfig;
  keyConfigStore: KeyConfigStore;
  lastSettingsStore: LastSettingsStore;
}
