import { defaultConfig } from '~/config/GlobalConfig';
import { Config } from '~/features/io/types/Config';
import { makeDefaultKeyConfigStore } from '~/stores/global/KeyConfigStore';

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
  const globalConfigStore = JSON.parse(JSON.stringify(defaultConfig));
  const keyConfigStore = JSON.parse(JSON.stringify(makeDefaultKeyConfigStore()));

  return {
    globalConfigStore,
    keyConfigStore,
  };
}

export function getFallbackedSettings(source: { globalConfigStore?: any; keyConfigStore?: any; lastSettingsStore?: any }) {
  const defaultSettings = getDefaultSettings();
  const fbGlobalConfigStore = deepObjectAssign(defaultSettings.globalConfigStore, source.globalConfigStore);
  const fbKeyConfigStore = deepObjectAssign(defaultSettings.keyConfigStore, source.keyConfigStore);

  return {
    globalConfigStore: fbGlobalConfigStore,
    keyConfigStore: fbKeyConfigStore,
  };
}
