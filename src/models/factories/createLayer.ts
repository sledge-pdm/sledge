import { v4 as uuidv4 } from 'uuid'
import { DSL } from '../dsl/DSL'
import { initLayer } from '../layer/layerImage'
import { Layer, LayerType } from '../types/Layer'

export const createLayer = (
  name: string,
  type: LayerType,
  enabled = true,
  dotMagnification = 1,
  dsl?: DSL
): Layer => {
  const id = uuidv4()
  initLayer(id, dotMagnification)
  return {
    id,
    name,
    type,
    typeDescription: getTypeString(type),
    enabled,
    dotMagnification,
    dsl: dsl || new DSL(id, id),
  }
}

function getTypeString(type: LayerType): string {
  switch (type) {
    case LayerType.Dot:
      return 'dot layer.'
    case LayerType.Image:
      return 'image layer.'
    case LayerType.Automate:
      return 'automate layer.'
    default:
      return 'N/A.'
  }
}
