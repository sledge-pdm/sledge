import { Vec2 } from '~/models/types/Vector'
import LayerImageAgent from '../LayerImageAgent'
import Tile from '../Tile'

export default class TileLayerImageAgent extends LayerImageAgent {
  readonly TILE_SIZE = 10

  private tiles: Tile[][] = []

  constructor(imageData: ImageData) {
    super(imageData)

    const width = this.getWidth()
    const height = this.getHeight()
    const tileRowCount = Math.ceil(width / this.TILE_SIZE)
    const tileColumnCount = Math.ceil(height / this.TILE_SIZE)
    for (let row = 0; row < tileRowCount; row++) {
      this.tiles[row] = []
      for (let column = 0; column < tileColumnCount; column++) {
        this.tiles[row][column] = new Tile(row, column, this.TILE_SIZE)
      }
    }
  }

  putImageInto(ctx: CanvasRenderingContext2D) {
    this.putOnlyForDirtyTiles(ctx, this.image)
  }

  putDrawingBufferInto(ctx: CanvasRenderingContext2D) {
    if (this.drawingBuffer) this.putOnlyForDirtyTiles(ctx, this.drawingBuffer)
  }

  private putOnlyForDirtyTiles(
    ctx: CanvasRenderingContext2D,
    image: ImageData
  ) {
    const dirtyTiles = this.getDirtyTiles()

    dirtyTiles.forEach((dirtyTile) => {
      const offset = dirtyTile.getOffset()
      ctx.putImageData(
        image,
        0,
        0,
        offset.x,
        offset.y,
        this.TILE_SIZE,
        this.TILE_SIZE
      )
    })
  }

  private getTileIndex(layerPosition: Vec2): { row: number; column: number } {
    const row = Math.floor(layerPosition.x / this.TILE_SIZE)
    const column = Math.floor(layerPosition.y / this.TILE_SIZE)
    return { row, column }
  }

  public resetDirtyStates() {
    this.tiles = this.tiles.map((tR) => {
      tR = tR.map((t) => {
        t.isDirty = false
        return t
      })
      return tR
    })
  }

  public getDirtyTiles(): Tile[] {
    return this.tiles.flatMap((tR) => tR.filter((t) => t.isDirty))
  }

  public setPixel(
    position: Vec2,
    r: number,
    g: number,
    b: number,
    a: number
  ): void {
    {
      if (
        position.x < 0 ||
        position.x >= this.getWidth() ||
        position.y < 0 ||
        position.y >= this.getHeight()
      )
        return
      const i = (position.y * this.getWidth() + position.x) * 4
      this.image.data[i + 0] = r
      this.image.data[i + 1] = g
      this.image.data[i + 2] = b
      this.image.data[i + 3] = a

      const tileIndex = this.getTileIndex(position)
      this.tiles[tileIndex.row][tileIndex.column].isDirty = true
    }

    // console.log(
    //   `somebody toucha my ${this.getTileInLayerPosition(position).toString()}!`
    // )

    // console.log(this.getDirtyTiles())
  }

  public getPixel(position: Vec2): [number, number, number, number] {
    const i = (position.y * this.image.width + position.x) * 4
    const d = this.image.data

    // console.log(
    //   `somebody gotta my ${this.getTileInLayerPosition(position).toString()}!`
    // )

    return [d[i], d[i + 1], d[i + 2], d[i + 3]]
  }
}
