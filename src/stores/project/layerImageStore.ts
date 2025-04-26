import { createStore } from 'solid-js/store'
import { LayerImage } from '~/types/LayerImage'
import { layerStore } from './layerStore'

// image
export const [layerImageStore, setLayerImageStore] = createStore<
  Record<string, LayerImage>
>({})

export const activeLayerImage = (): LayerImage =>
  layerImageStore[layerStore.activeLayerId]

export const canUndo = (): boolean =>
  layerImageStore[layerStore.activeLayerId]?.undoStack.length > 0
export const canRedo = (): boolean =>
  layerImageStore[layerStore.activeLayerId]?.redoStack.length > 0
