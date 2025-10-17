import { createStore } from 'solid-js/store';
import { GlobalConfig } from '~/config/GlobalConfig';
import { getDefaultSettings } from '~/features/io/config/set';
import { Config } from '~/features/io/types/Config';
import { KeyConfigStore } from '~/stores/global/KeyConfigStore';
import { LastSettingsStore } from '~/stores/global/LastSettingsStore';

export const initGlobalStore = () => {
  const defaultSettings = getDefaultSettings();
  const [globalConfigStore, setGlobalConfigStore] = createStore<GlobalConfig>(defaultSettings.globalConfigStore);
  const [keyConfigStore, setKeyConfigStore] = createStore<KeyConfigStore>(defaultSettings.keyConfigStore);
  const [lastSettingsStore, setLastSettingsStore] = createStore<LastSettingsStore>(defaultSettings.lastSettingsStore);

  return { globalConfigStore, setGlobalConfigStore, keyConfigStore, setKeyConfigStore, lastSettingsStore, setLastSettingsStore };
};

let globalRootStore = initGlobalStore();

export const getGlobalRootStore = () => globalRootStore;

export const globalConfig = globalRootStore.globalConfigStore;
export const setGlobalConfig = globalRootStore.setGlobalConfigStore;

export const keyConfigStore = globalRootStore.keyConfigStore;
export const setKeyConfigStore = globalRootStore.setKeyConfigStore;

export const lastSettingsStore = globalRootStore.lastSettingsStore;
export const setLastSettingsStore = globalRootStore.setLastSettingsStore;

export const loadConfigToGlobalStore = (store: Config) => {
  setGlobalConfig(store.globalConfigStore);
  setKeyConfigStore(store.keyConfigStore);
  setLastSettingsStore(store.lastSettingsStore);
};
