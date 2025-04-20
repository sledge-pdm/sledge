import { HistoryManager } from './../HistoryManager'
import { Vec2 } from '~/models/types/Vector'
import LayerImageAgent from '../LayerImageAgent'
import Tile from '../Tile'
import { PixelDiff } from '../HistoryManager'

export default class TileLayerImageAgent extends LayerImageAgent {
  readonly TILE_SIZE = 10

  private tiles: Tile[][] = []

  constructor(imageData: ImageData, historyManager: HistoryManager) {
    super(imageData, historyManager)
  }

  initTile() {
    const tileRowCount = Math.ceil(this.getWidth() / this.TILE_SIZE)
    const tileColumnCount = Math.ceil(this.getHeight() / this.TILE_SIZE)
    for (let row = 0; row < tileRowCount; row++) {
      this.tiles[row] = []
      for (let column = 0; column < tileColumnCount; column++) {
        this.tiles[row][column] = new Tile(row, column, this.TILE_SIZE)
      }
    }
  }

  setImage(image: ImageData): void {
    super.setImage(image)
    this.initTile()
  }

  putImageInto(ctx: CanvasRenderingContext2D) {
    if (this.getDirtyTiles().length > 0) {
      this.putOnlyForDirtyTiles(ctx, this.image)
    }
  }

  putDrawingBufferInto(ctx: CanvasRenderingContext2D) {
    if (this.getDirtyTiles().length > 0) {
      if (this.drawingBuffer) this.putOnlyForDirtyTiles(ctx, this.drawingBuffer)
    }
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

    this.resetDirtyStates()
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

  public resetAllDirtyStates() {
    this.tiles = this.tiles.map((tR) => {
      tR = tR.map((t) => {
        t.isDirty = false
        t.isDirtyThroughAction = false
        return t
      })
      return tR
    })
  }

  public getDirtyTiles(): Tile[] {
    return this.tiles.flatMap((tR) => tR.filter((t) => t.isDirty))
  }
  public getDirtyTilesInAction(): Tile[] {
    return this.tiles.flatMap((tR) => tR.filter((t) => t.isDirtyThroughAction))
  }

  public addPixelDiffs(diffs: PixelDiff[]) {
    super.addPixelDiffs(diffs)
  }

  public setPixel(
    position: Vec2,
    r: number,
    g: number,
    b: number,
    a: number
  ): PixelDiff | undefined {
    const result = this.setPixelInPosition(position, r, g, b, a)
    if (result !== undefined) {
      const tileIndex = this.getTileIndex(position)
      this.tiles[tileIndex.row][tileIndex.column].isDirty = true
      this.tiles[tileIndex.row][tileIndex.column].isDirtyThroughAction = true
    }
    return result
  }

  public deletePixel(position: Vec2): PixelDiff | undefined {
    const result = this.deletePixelInPosition(position)
    if (result !== undefined) {
      const tileIndex = this.getTileIndex(position)
      this.tiles[tileIndex.row][tileIndex.column].isDirty = true
      this.tiles[tileIndex.row][tileIndex.column].isDirtyThroughAction = true
    }
    return result
  }

  public getPixel(position: Vec2): [number, number, number, number] {
    const i = (position.y * this.image.width + position.x) * 4
    const d = this.image.data

    return [d[i], d[i + 1], d[i + 2], d[i + 3]]
  }
}
