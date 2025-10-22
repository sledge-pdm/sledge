import { createStore } from 'solid-js/store';
import { GlobalConfig } from '~/config/GlobalConfig';
import { getDefaultSettings } from '~/features/io/config/set';
import { Config } from '~/features/io/types/Config';
import { KeyConfigStore } from '~/stores/global/KeyConfigStore';

export const initGlobalStore = () => {
  const defaultSettings = getDefaultSettings();
  const [globalConfigStore, setGlobalConfigStore] = createStore<GlobalConfig>(defaultSettings.globalConfigStore);
  const [keyConfigStore, setKeyConfigStore] = createStore<KeyConfigStore>(defaultSettings.keyConfigStore);

  return { globalConfigStore, setGlobalConfigStore, keyConfigStore, setKeyConfigStore };
};

let globalRootStore = initGlobalStore();

export const getGlobalRootStore = () => globalRootStore;

export const globalConfig = globalRootStore.globalConfigStore;
export const setGlobalConfig = globalRootStore.setGlobalConfigStore;

export const keyConfigStore = globalRootStore.keyConfigStore;
export const setKeyConfigStore = globalRootStore.setKeyConfigStore;

export const loadConfigToGlobalStore = (store: Config) => {
  setGlobalConfig(store.globalConfigStore);
  setKeyConfigStore(store.keyConfigStore);
};
