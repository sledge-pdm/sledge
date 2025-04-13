import { createStore } from 'solid-js/store'
import { runDSL } from '~/dsl/DSLRunner'
import { createPen } from '~/models/factories/createPen'
import { imageStore, setImageStore } from './imageStore'
import { findLayerById } from './layerStore'

// pen

export const [penStore, setPenStore] = createStore({
  usingIndex: 0,
  pens: [createPen('pen', 1, '#000000'), createPen('eraser', 4, 'none')],
})
export const currentPen = () => penStore.pens[penStore.usingIndex]

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
