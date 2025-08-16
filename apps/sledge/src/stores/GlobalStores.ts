import { createStore } from 'solid-js/store';
import { ExportSettings } from '~/components/dialogs/ExportDialog';
import { getDefaultSettings } from '~/io/config/set';
import { GlobalConfig } from '~/models/config/GlobalConfig';
import { KeyConfigEntry } from '~/models/config/KeyConfig';
import { KeyConfigCommands } from '~/models/Consts';

// global
type KeyConfigStore = {
  [command in KeyConfigCommands]: KeyConfigEntry[];
};
type LastSettingsStore = {
  exportSettings: ExportSettings;
};

const KEY_CONFIG_TEMPLATE: Readonly<KeyConfigStore> = {
  save: [{ ctrl: true, key: 's' }],
  undo: [{ ctrl: true, key: 'z' }],
  redo: [{ ctrl: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
  pipette: [{ alt: true }],
  'selection move': [{ shift: true }],
} as const;
export const makeDefaultKeyConfigStore = (): KeyConfigStore => structuredClone(KEY_CONFIG_TEMPLATE);
export const defaultLastSettingsStore: LastSettingsStore = {
  exportSettings: {
    dirPath: undefined,
    fileName: '',
    exportOptions: {
      format: 'png',
      quality: 95,
      scale: 1,
    },
    showDirAfterSave: false,
  },
};
export const initGlobalStore = () => {
  const defaultSettings = getDefaultSettings();
  const [globalConfigStore, setGlobalConfigStore] = createStore(defaultSettings.globalConfigStore);
  const [keyConfigStore, setKeyConfigStore] = createStore(defaultSettings.keyConfigStore);
  const [lastSettingsStore, setLastSettingsStore] = createStore(defaultSettings.lastSettingsStore);

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

export const loadConfigToGlobalStore = (store: {
  globalConfigStore: GlobalConfig;
  keyConfigStore: KeyConfigStore;
  lastSettingsStore: LastSettingsStore;
}) => {
  setGlobalConfig(store.globalConfigStore);
  setKeyConfigStore(store.keyConfigStore);
  setLastSettingsStore(store.lastSettingsStore);
};
