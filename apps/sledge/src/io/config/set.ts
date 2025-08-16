import { defaultConfig } from '~/models/config/GlobalConfig';
import { defaultLastSettingsStore, makeDefaultKeyConfigStore } from '~/stores/GlobalStores';

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

export async function getDefaultSettings() {
  const globalConfigStore = deepObjectAssign({}, defaultConfig);
  const keyConfigStore = deepObjectAssign({}, makeDefaultKeyConfigStore());
  const lastSettingsStore = deepObjectAssign({}, defaultLastSettingsStore);

  console.log({
    globalConfigStore,
    keyConfigStore,
    lastSettingsStore,
  });

  return {
    globalConfigStore,
    keyConfigStore,
    lastSettingsStore,
  };
}

export async function getFallbackedSettings(source: { globalConfigStore?: any; keyConfigStore?: any; lastSettingsStore?: any }) {
  const fbGlobalConfigStore = deepObjectAssign(defaultConfig, source.globalConfigStore);
  const fbKeyConfigStore = deepObjectAssign(makeDefaultKeyConfigStore(), source.keyConfigStore);
  const fbLastSettingsStore = deepObjectAssign(defaultLastSettingsStore, source.lastSettingsStore);

  console.log({
    fbGlobalConfigStore,
    fbKeyConfigStore,
    fbLastSettingsStore,
  });

  return {
    globalConfigStore: fbGlobalConfigStore,
    keyConfigStore: fbKeyConfigStore,
    lastSettingsStore: fbLastSettingsStore,
  };
}
