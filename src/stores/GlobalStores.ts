import { createStore } from 'solid-js/store';
import { CanvasRenderingMode } from '~/types/Canvas';
import { FileLocation } from '~/types/FileLocation';
import { KeyConfigEntry } from '~/types/KeyConfig';
import { Size2D } from '~/types/Size';

// global
export const getCanvasImageRenderingAttribute = (
  zoom: number,
  mode: CanvasRenderingMode
): 'pixelated' | 'crisp-edges' => {
  switch (mode) {
    case 'pixelated':
      return 'pixelated';
    case 'crispEdges':
      return 'crisp-edges';
    case 'adaptive':
      return zoom > 1.0 ? 'pixelated' : 'crisp-edges';
  }
};

type GlobalConfigStore = {
  maxRecentFiles: number;
  recentFiles: FileLocation[];
  newProjectCanvasSize: Size2D;
  canvasRenderingMode: CanvasRenderingMode;
  showDirtyRects: boolean;
  showPerfMonitor: boolean;
};
type KeyConfigStore = {
  [command: string]: KeyConfigEntry[];
};

const defaultGlobalConfigStore: GlobalConfigStore = {
  maxRecentFiles: 8,
  recentFiles: [],

  newProjectCanvasSize: {
    width: 1000,
    height: 1000,
  },
  canvasRenderingMode: 'adaptive' as CanvasRenderingMode,

  showDirtyRects: false,
  showPerfMonitor: false,
};
const KEY_CONFIG_TEMPLATE: Readonly<KeyConfigStore> = {
  undo: [{ ctrl: true, key: 'z' }],
  redo: [{ ctrl: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
} as const;
export const makeDefaultKeyConfigStore = (): KeyConfigStore => structuredClone(KEY_CONFIG_TEMPLATE);

const initGlobalStore = () => {
  const [globalConfigStore, setGlobalConfigStore] = createStore(defaultGlobalConfigStore);
  const [keyConfigStore, setKeyConfigStore] = createStore(makeDefaultKeyConfigStore());

  return { globalConfigStore, setGlobalConfigStore, keyConfigStore, setKeyConfigStore };
};

let globalRootStore = initGlobalStore();

export const getGlobalRootStore = () => globalRootStore;

export const globalStore = globalRootStore.globalConfigStore;
export const setGlobalStore = globalRootStore.setGlobalConfigStore;

export const keyConfigStore = globalRootStore.keyConfigStore;
export const setKeyConfigStore = globalRootStore.setKeyConfigStore;

export const loadGlobalStore = (store: { globalConfigStore: GlobalConfigStore; keyConfigStore: KeyConfigStore }) => {
  setGlobalStore(store.globalConfigStore);
  setKeyConfigStore(store.keyConfigStore);
};
