import { createStore } from 'solid-js/store'
import { createLayer } from '~/models/factories/createLayer'
import { LayerType } from '~/models/types/Layer'

// layer
const DEFAULT_LAYERS = [createLayer('dot1', LayerType.Dot, true, 1)]

export const [layerStore, setLayerStore] = createStore({
  layers: DEFAULT_LAYERS,
  activeLayerId: DEFAULT_LAYERS[0].id,
})

export const allLayers = () => layerStore.layers
export const findLayerById = (id: string) =>
  allLayers().find((layer) => layer.id === id)
export const activeLayer = () => findLayerById(layerStore.activeLayerId)
export const activeIndex = () =>
  allLayers().findIndex((layer) => layer.id === layerStore.activeLayerId)
