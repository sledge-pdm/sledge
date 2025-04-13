import { DSL } from '../dsl/DSL'
import { LayerType } from '../types/Layer'
import { createLayer } from './createLayer'
import { allLayers, layerStore, setLayerStore } from '~/stores/layerStore'

export const addLayer = (
  name: string,
  type: LayerType = LayerType.Dot,
  enabled = true,
  dotMagnification = 1,
  dsl?: DSL
) => {
  const newLayer = createLayer(name, type, enabled, dotMagnification, dsl)

  const layers = [...allLayers()]
  layers.push(newLayer)

  setLayerStore('layers', layers)

  return layers
}
