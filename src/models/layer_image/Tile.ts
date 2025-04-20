import { Vec2 } from '../types/Vector'

export default class Tile {
  // 一連の動作全体で変更があったか（累計表示、UI表示用）
  public isDirtyThroughAction: boolean
  // 前回の描画更新から変更があったか（canvas更新用）
  public isDirty: boolean

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
      x: this.row * this.globalTileSize,
      y: this.column * this.globalTileSize,
    }
  }

  updateState() {
    // TODO (...maybe slow if All Layers Updated at once)
  }
}
