import { GlobalConfig } from '~/config/GlobalConfig';
import { KeyConfigStore } from '~/config/KeyConfig';

// config json saved to config.json
export interface Config {
  globalConfigStore: GlobalConfig;
  // Legacy fallback for older config files.
  keyConfigStore?: KeyConfigStore;
}
