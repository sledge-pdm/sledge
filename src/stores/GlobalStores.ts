import { createStore } from 'solid-js/store';
import { CanvasRenderingMode } from '~/models/canvas/Canvas';
import { KeyConfigEntry } from '~/models/config/KeyConfig';
import { FileLocation } from '~/types/FileLocation';
import { KeyConfigCommands } from '~/utils/consts';

// global
export const getCanvasImageRenderingAttribute = (zoom: number, mode: CanvasRenderingMode): 'pixelated' | 'crisp-edges' => {
  switch (mode) {
    case 'pixelated':
      return 'pixelated';
    case 'crispEdges':
      return 'crisp-edges';
    case 'adaptive':
      return zoom > 1.0 ? 'pixelated' : 'crisp-edges';
  }
};
// types.ts
export type GlobalConfig = {
  misc: {
    maxRecentFiles: number;
    recentFiles: FileLocation[]; // これは別ストア(sessionState)に分離してもOK
  };
  newProject: {
    canvasSize: { width: number; height: number };
  };
  performance: {
    canvasRenderingMode: CanvasRenderingMode;
    enableGLRender: boolean;
  };
  debug: {
    showPerfMonitor: boolean;
    showDirtyRects: boolean;
  };
};
type KeyConfigStore = {
  [command in KeyConfigCommands]: KeyConfigEntry[];
};

export const defaultConfig: GlobalConfig = {
  misc: { maxRecentFiles: 8, recentFiles: [] },
  newProject: { canvasSize: { width: 1000, height: 1000 } },
  performance: { canvasRenderingMode: 'adaptive', enableGLRender: true },
  debug: { showPerfMonitor: false, showDirtyRects: false },
};
const KEY_CONFIG_TEMPLATE: Readonly<KeyConfigStore> = {
  undo: [{ ctrl: true, key: 'z' }],
  redo: [{ ctrl: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
} as const;
export const makeDefaultKeyConfigStore = (): KeyConfigStore => structuredClone(KEY_CONFIG_TEMPLATE);
export const initGlobalStore = () => {
  const [globalConfigStore, setGlobalConfigStore] = createStore(defaultConfig);
  const [keyConfigStore, setKeyConfigStore] = createStore(makeDefaultKeyConfigStore());

  return { globalConfigStore, setGlobalConfigStore, keyConfigStore, setKeyConfigStore };
};

let globalRootStore = initGlobalStore();

export const getGlobalRootStore = () => globalRootStore;

export const globalConfig = globalRootStore.globalConfigStore;
export const setGlobalConfig = globalRootStore.setGlobalConfigStore;

export const keyConfigStore = globalRootStore.keyConfigStore;
export const setKeyConfigStore = globalRootStore.setKeyConfigStore;

export const loadGlobalStore = (store: { globalConfigStore: GlobalConfig; keyConfigStore: KeyConfigStore }) => {
  setGlobalConfig(store.globalConfigStore);
  setKeyConfigStore(store.keyConfigStore);
};
