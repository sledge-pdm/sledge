import { createStore } from 'solid-js/store';
import { saveGlobalSettings } from '~/io/global/globalIO';
import { CanvasRenderingMode } from '~/types/Canvas';
import { FileLocation } from '~/types/FileLocation';

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

export const createGlobalStore = () => {};
export const [globalStore, setGlobalStore] = createStore({
  recentOpenedFiles: [
    {
      path: 'C:\\Users\\innsb\\Documents',
      name: 'project.sledge',
    },
  ],

  showDirtyRects: false,
  canvasRenderingMode: 'adaptive' as CanvasRenderingMode,

  showPerfMonitor: false,
});

export const addRecent = (loc: FileLocation) => {
  const path = loc.path;
  const name = loc.name;

  // add to recent
  setGlobalStore((store) => {
    console.log('path: ' + path);
    console.log('name: ' + name);
    if (name && path && store.recentOpenedFiles) {
      // 履歴にあっても一旦削除
      const oldRecentFiles = store.recentOpenedFiles.filter((f) => {
        return f.name !== name || f.path !== path?.toString();
      });
      // その後、一番上に追加
      const newRecentFiles: FileLocation[] = [
        {
          name: name,
          path: path,
        },
        ...oldRecentFiles,
      ];
      setGlobalStore('recentOpenedFiles', newRecentFiles);
      saveGlobalSettings();
    }
    return store;
  });
};
