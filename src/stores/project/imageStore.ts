import { createStore } from 'solid-js/store'
import { runDSL } from '~/models/dsl/DSLRunner'
import { LayerImage } from '~/models/types/LayerImage'
import { findLayerById, layerStore } from './layerStore'

// image

export const [imageStore, setImageStore] = createStore<
  Record<string, LayerImage>
>({})

export const activeImage = (): LayerImage =>
  imageStore[layerStore.activeLayerId]

export const updateDSL = (layerId: string) => {
  const dsl = findLayerById(layerId)?.dsl
  const image = imageStore[layerId].current
  if (dsl === undefined) return
  runDSL(dsl, image).then((result) => {
    if (result) {
      setImageStore(layerId, 'DSLcurrent', result)
    }
  })
}
