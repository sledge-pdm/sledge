import { createStore } from 'solid-js/store'
import { LayerImageState } from '~/models/types/LayerImageState'
import { layerStore } from './layerStore'

// image

export const [imageStore, setImageStore] = createStore<
  Record<string, LayerImageState>
>({})
export const activeImage = (): LayerImageState =>
  imageStore[layerStore.activeLayerId]
