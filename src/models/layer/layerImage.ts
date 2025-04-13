import { canvasStore } from '~/stores/canvasStore'
import { setImageStore } from '~/stores/imageStore'
import { LayerImageState } from '../types/LayerImageState'

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
  setImageStore(layerId, (state: LayerImageState) => {
    const prev = state.current
    return {
      current: newData,
      undoStack: [...state.undoStack, prev],
      redoStack: [],
    }
  })
}
