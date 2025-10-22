import { GlobalConfig } from '~/config/GlobalConfig';
import { KeyConfigStore } from '~/stores/global/KeyConfigStore';

// config json saved to config.json
export interface Config {
  globalConfigStore: GlobalConfig;
  keyConfigStore: KeyConfigStore;
}
