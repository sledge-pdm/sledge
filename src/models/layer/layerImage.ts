import { canvasStore } from '~/stores/project/canvasStore'
import { setImageStore } from '~/stores/project/imageStore'
import { LayerImage } from '../types/LayerImage'

export function initLayer(layerId: string, dotMagnification: number) {
  const blank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification)
  )
  const dslBlank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification)
  )
  setImageStore(layerId, {
    current: blank,
    DSLcurrent: dslBlank,
    undoStack: [],
    redoStack: [],
  })
}

export function registerNewHistory(layerId: string, newData: ImageData) {
  setImageStore(layerId, (state: LayerImage) => {
    const prev = state.current
    return {
      current: newData,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    }
  })
}
