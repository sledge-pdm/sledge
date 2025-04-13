import { DSL } from '~/models/dsl/DSL'

export enum LayerType {
  Dot,
  Image,
  Automate,
}

export type Layer = {
  id: string
  name: string
  type: LayerType
  typeDescription: string // 各タイプの説明
  enabled: boolean
  dotMagnification: number
  dsl: DSL
}
