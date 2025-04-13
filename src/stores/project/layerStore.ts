import { createStore } from 'solid-js/store'
import { createLayer } from '~/models/factories/createLayer'
import { Layer, LayerType } from '~/models/types/Layer'

// layer

export const [layerStore, setLayerStore] = createStore({
  layers: new Array<Layer>(),
  activeLayerId: '',
})

export const allLayers = () => layerStore.layers
export const findLayerById = (id: string) =>
  allLayers().find((layer) => layer.id === id)
export const activeLayer = () => findLayerById(layerStore.activeLayerId)
export const activeIndex = () =>
  allLayers().findIndex((layer) => layer.id === layerStore.activeLayerId)
