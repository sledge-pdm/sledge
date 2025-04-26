import { createStore } from 'solid-js/store'
import { saveGlobalSettings } from '~/io/global/globalIO'
import { canvasStore } from '../project/canvasStore'
import { CanvasRenderingMode } from '~/types/Canvas'
import { FileLocation } from '~/types/FileLocation'

// global
export const getCanvasImageRenderingAttribute = (mode: CanvasRenderingMode) => {
  switch (mode) {
    case 'pixelated':
    case 'crispEdges':
      return mode
    case 'adaptive':
      return canvasStore.zoom > 1.0 ? 'pixelated' : 'crispEdges'
  }
}

export const [globalStore, setGlobalStore] = createStore({
  recentOpenedFiles: [
    {
      path: 'C:\\Users\\innsb\\Documents',
      name: 'project.sledge',
    },
  ],

  showDirtyRects: false,
  canvasRenderingMode: 'adaptive' as CanvasRenderingMode,
})

export const addRecent = (loc: FileLocation) => {
  const path = loc.path
  const name = loc.name

  // add to recent
  setGlobalStore((store) => {
    console.log('path: ' + path)
    console.log('name: ' + name)
    if (name && path && store.recentOpenedFiles) {
      // 履歴にあっても一旦削除
      const oldRecentFiles = store.recentOpenedFiles.filter((f) => {
        return f.name !== name || f.path !== path?.toString()
      })
      // その後、一番上に追加
      const newRecentFiles: FileLocation[] = [
        {
          name: name,
          path: path,
        },
        ...oldRecentFiles,
      ]
      setGlobalStore('recentOpenedFiles', newRecentFiles)
      saveGlobalSettings()
    }
    return store
  })
}
