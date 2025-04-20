import { Vec2 } from '../types/Vector'

export default class Tile {
  public isDirty: boolean

  constructor(
    public readonly row: number,
    public readonly column: number,
    public readonly globalTileSize: number
  ) {
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
