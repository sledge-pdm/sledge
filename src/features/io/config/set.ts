import { makeDefaultGlobalConfig } from '~/config/GlobalConfig';
import { Config } from '~/features/io/types/Config';

function deepObjectAssign(target: any, ...sources: any[]) {
  sources.forEach((source) => {
    Object.keys(source).forEach((key) => {
      const s_val = source[key];
      const t_val = target[key];
      target[key] = t_val && s_val && typeof t_val === 'object' && typeof s_val === 'object' ? deepObjectAssign(t_val, s_val) : s_val;
    });
  });
  return target;
}

export function getDefaultSettings(): Config {
  const globalConfigStore = JSON.parse(JSON.stringify(makeDefaultGlobalConfig()));

  return {
    globalConfigStore,
  };
}

export function getFallbackedSettings(source: { globalConfigStore?: any; keyConfigStore?: any; lastSettingsStore?: any }) {
  const defaultSettings = getDefaultSettings();
  const fbGlobalConfigStore = deepObjectAssign(defaultSettings.globalConfigStore, source.globalConfigStore);

  // Migration support: accept legacy keyConfigStore at root.
  if (source.keyConfigStore) {
    fbGlobalConfigStore.keyConfig = deepObjectAssign(defaultSettings.globalConfigStore.keyConfig, source.keyConfigStore);
  }

  return {
    globalConfigStore: fbGlobalConfigStore,
  };
}
