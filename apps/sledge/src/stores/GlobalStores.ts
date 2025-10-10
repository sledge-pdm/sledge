import { createStore } from 'solid-js/store';
import { ExportSettings } from '~/components/section/export/ExportContent';
import { KeyConfigCommands } from '~/Consts';
import { GlobalConfig } from '~/features/config/models/GlobalConfig';
import { KeyConfigEntry } from '~/features/config/models/KeyConfig';
import { getDefaultSettings } from '~/features/io/config/set';
import { isMacOS } from '~/utils/OSUtils';

// global
export type KeyConfigStore = {
  [command in KeyConfigCommands]: KeyConfigEntry[];
};
export type LastSettingsStore = {
  exportSettings: ExportSettings;
  exportedDirPaths: string[];
};

const KEY_CONFIG_TEMPLATE_DEFAULT: Readonly<KeyConfigStore> = {
  save: [{ ctrl: true, key: 's' }],
  undo: [{ ctrl: true, key: 'z' }],
  redo: [{ ctrl: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  rect_select: [{ key: 'r' }],
  auto_select: [{ key: 'a' }],
  move: [{ key: 'm' }],
  pipette: [{ alt: true }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
} as const;
const KEY_CONFIG_TEMPLATE_MAC: Readonly<KeyConfigStore> = {
  save: [{ meta: true, key: 's' }],
  undo: [{ meta: true, key: 'z' }],
  redo: [{ meta: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  rect_select: [{ key: 'r' }],
  auto_select: [{ key: 'a' }],
  move: [{ key: 'm' }],
  pipette: [{ alt: true }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
} as const;

export const makeDefaultKeyConfigStore = (): KeyConfigStore => {
  return structuredClone(isMacOS() ? KEY_CONFIG_TEMPLATE_MAC : KEY_CONFIG_TEMPLATE_DEFAULT);
};

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
  exportedDirPaths: [],
};
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

export const loadConfigToGlobalStore = (store: {
  globalConfigStore: GlobalConfig;
  keyConfigStore: KeyConfigStore;
  lastSettingsStore: LastSettingsStore;
}) => {
  setGlobalConfig(store.globalConfigStore);
  setKeyConfigStore(store.keyConfigStore);
  setLastSettingsStore(store.lastSettingsStore);
};
