import { canvasStore } from '~/stores/project/canvasStore'
import { setLayerImageStore } from '~/stores/project/layerImageStore'

export function initLayerImage(layerId: string, dotMagnification: number) {
  const blank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification)
  )
  setLayerImageStore(layerId, {
    current: blank,
    undoStack: [],
    redoStack: [],
  })
}
