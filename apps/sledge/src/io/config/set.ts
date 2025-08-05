import { defaultConfig } from '~/models/config/GlobalConfig';
import { defaultLastSettingsStore, loadGlobalStore, makeDefaultKeyConfigStore } from '~/stores/GlobalStores';

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

export default async function setGlobalSettings(data: any) {
  const globalConfigStore = deepObjectAssign({}, defaultConfig, data.globalConfigStore);
  const keyConfigStore = deepObjectAssign({}, makeDefaultKeyConfigStore(), data.keyConfigStore);
  const lastSettingsStore = deepObjectAssign({}, defaultLastSettingsStore, data.lastSettingsStore);

  loadGlobalStore({
    globalConfigStore,
    keyConfigStore,
    lastSettingsStore,
  });
}
