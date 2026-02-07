import { createStore } from 'solid-js/store';
import { GlobalConfig } from '~/config/GlobalConfig';
import { getDefaultSettings } from '~/features/io/config/set';
import { Config } from '~/features/io/types/Config';

export const initGlobalStore = () => {
  const defaultSettings = getDefaultSettings();
  const [globalConfigStore, setGlobalConfigStore] = createStore<GlobalConfig>(defaultSettings.globalConfigStore);

  return { globalConfigStore, setGlobalConfigStore };
};

let globalRootStore = initGlobalStore();

export const getGlobalRootStore = () => globalRootStore;

export const globalConfig = globalRootStore.globalConfigStore;
export const setGlobalConfig = globalRootStore.setGlobalConfigStore;

// Convenience aliases for key config nested in global config.
export const keyConfigStore = () => globalRootStore.globalConfigStore.keyConfig;
export const setKeyConfigStore = (...args: any[]) => {
  // Accept both object/setter style updates and nested path updates.
  (globalRootStore.setGlobalConfigStore as unknown as (...args: any[]) => void)('keyConfig', ...(args as any));
};

export const loadConfigToGlobalStore = (store: Config) => {
  setGlobalConfig(store.globalConfigStore);
  if (store.keyConfigStore) {
    // Legacy config support.
    setKeyConfigStore(store.keyConfigStore);
  }
};
