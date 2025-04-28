import { createStore } from 'solid-js/store';
import { CanvasRenderingMode } from '~/types/Canvas';
import { FileLocation } from '~/types/FileLocation';
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

const initGlobalStore = () => {
  const [globalConfigStore, setGlobalConfigStore] = createStore(defaultGlobalConfigStore);
  return { globalConfigStore, setGlobalConfigStore };
};

let globalRootStore = initGlobalStore();

export const globalStore = globalRootStore.globalConfigStore;
export const setGlobalStore = globalRootStore.setGlobalConfigStore;
