import { RGBAColor } from '~/utils/colorUtils'
import { Vec2 } from '../types/Vector'

export interface TileIndex {
  row: number
  column: number
}

export default class Tile {
  // 一連の動作全体で変更があったか（累計表示、UI表示用）
  public isDirtyThroughAction: boolean
  // 前回の描画更新から変更があったか（canvas更新用）
  public isDirty: boolean

  // このタイルが単色（すべて同一RGBA）なら true
  public isUniform = false
  // 単色時のカラーキャッシュ
  public uniformColor: RGBAColor | undefined = undefined

  constructor(
    public readonly row: number,
    public readonly column: number,
    public readonly globalTileSize: number
  ) {
    this.isDirtyThroughAction = false
    this.isDirty = false
  }

  toString(): string {
    return `Tile[${this.row},${this.column}]`
  }

  public getOffset(): Vec2 {
    return {
      x: this.column * this.globalTileSize,
      y: this.row * this.globalTileSize,
    }
  }

  public isInBounds(positionInTile: Vec2) {
    return (
      positionInTile.x >= 0 &&
      positionInTile.x < this.globalTileSize &&
      positionInTile.y >= 0 &&
      positionInTile.y < this.globalTileSize
    )
  }

  updateState() {}
}
