import Tile, { TileIndex } from '~/types/Tile';
import { Vec2 } from '~/types/Vector';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import { HistoryManager, PixelDiff, TileDiff } from '../HistoryManager';
import LayerImageAgent from '../LayerImageAgent';

export default class TileLayerImageAgent extends LayerImageAgent {
  readonly TILE_SIZE = 32;

  private tiles: Tile[][] = [];

  getTile(index: TileIndex) {
    // console.log(`tile access to ${index.row}. ${index.column}`)
    return this.tiles[index.row][index.column];
  }

  getTiles() {
    return this.tiles;
  }

  constructor(imageData: ImageData, historyManager: HistoryManager) {
    super(imageData, historyManager);
    this.initTile();
  }

  initTile() {
    const tileRowCount = Math.ceil(this.getHeight() / this.TILE_SIZE);
    const tileColumnCount = Math.ceil(this.getWidth() / this.TILE_SIZE);
    for (let row = 0; row < tileRowCount; row++) {
      this.tiles[row] = [];
      for (let column = 0; column < tileColumnCount; column++) {
        this.tiles[row][column] = new Tile(row, column, this.TILE_SIZE);
      }
    }
    this.scanAllTilesUniformity();
  }

  scanAllTilesUniformity() {
    const { TILE_SIZE } = this;
    const w = this.getWidth();
    const h = this.getHeight();

    for (const row of this.tiles) {
      for (const tile of row) {
        const { x: ox, y: oy } = tile.getOffset();

        // ①タイルの左上ピクセルを基準色に
        const base = this.getPixel({ x: ox, y: oy });

        let uniform = true;
        // ②タイル内を走査（画像端は超えないよう clamp）
        for (let dy = 0; dy < TILE_SIZE && uniform; dy++) {
          const py = oy + dy;
          if (py >= h) break;
          for (let dx = 0; dx < TILE_SIZE; dx++) {
            const px = ox + dx;
            if (px >= w) break;
            if (!colorMatch(this.getPixel({ x: px, y: py }), base)) {
              uniform = false;
              break;
            }
          }
        }
        // ③結果を保存
        tile.isUniform = uniform;
        tile.uniformColor = uniform ? base : undefined;
      }
    }
  }

  setImage(image: ImageData): void {
    super.setImage(image);
    this.initTile();
  }

  putImageInto(ctx: CanvasRenderingContext2D) {
    if (this.getDirtyTiles().length > 0) {
      this.putOnlyForDirtyTiles(ctx, this.image);
    }
  }

  putDrawingBufferInto(ctx: CanvasRenderingContext2D) {
    if (this.getDirtyTiles().length > 0) {
      if (this.drawingBuffer) this.putOnlyForDirtyTiles(ctx, this.drawingBuffer);
    }
  }

  private putOnlyForDirtyTiles(ctx: CanvasRenderingContext2D, image: ImageData) {
    const dirtyTiles = this.getDirtyTiles();

    dirtyTiles.forEach((dirtyTile) => {
      const offset = dirtyTile.getOffset();
      ctx.putImageData(image, 0, 0, offset.x, offset.y, this.TILE_SIZE, this.TILE_SIZE);
    });

    this.resetDirtyStates();
  }

  public getTileIndex(layerPosition: Vec2): TileIndex {
    const row = Math.floor(layerPosition.y / this.TILE_SIZE);
    const column = Math.floor(layerPosition.x / this.TILE_SIZE);
    return { row, column };
  }

  public resetDirtyStates() {
    this.tiles = this.tiles.map((tR) => {
      tR = tR.map((t) => {
        t.isDirty = false;
        return t;
      });
      return tR;
    });
  }

  public resetAllDirtyStates() {
    this.tiles = this.tiles.map((tR) => {
      tR = tR.map((t) => {
        t.isDirty = false;
        t.isDirtyThroughAction = false;
        return t;
      });
      return tR;
    });
  }

  public getDirtyTiles(): Tile[] {
    return this.tiles.flatMap((tR) => tR.filter((t) => t.isDirty));
  }
  public getDirtyTilesInAction(): Tile[] {
    return this.tiles.flatMap((tR) => tR.filter((t) => t.isDirtyThroughAction));
  }

  protected undoTileDiff(tileDiff: TileDiff): void {
    console.log(`tilediff. fill ${tileDiff.beforeColor}`);
    if (tileDiff.beforeColor) this.fillWholeTile(tileDiff.index, tileDiff.beforeColor, false);
  }

  protected redoTileDiff(tileDiff: TileDiff): void {
    console.log(`tilediff. fill ${tileDiff.afterColor}`);
    this.fillWholeTile(tileDiff.index, tileDiff.afterColor, false);
  }

  public setPixel(
    position: Vec2,
    color: RGBAColor,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    const result = this.setPixelInPosition(position, color, excludePositionMatch, excludeColorMatch);
    if (result !== undefined) {
      const tileIndex = this.getTileIndex(position);
      this.tiles[tileIndex.row][tileIndex.column].isDirty = true;
      this.tiles[tileIndex.row][tileIndex.column].isDirtyThroughAction = true;

      const tile = this.getTile(tileIndex);
      if (tile.isUniform && tile.uniformColor !== undefined && colorMatch(tile.uniformColor, color)) {
        this.tiles[tileIndex.row][tileIndex.column].isUniform = false;
        this.tiles[tileIndex.row][tileIndex.column].uniformColor = undefined;
      }
    }
    return result;
  }

  fillWholeTile(index: TileIndex, color: RGBAColor, collectDiff = true) {
    const tile = this.getTile(index);
    if (tile.isUniform && tile.uniformColor && colorMatch(tile.uniformColor, color)) return;

    const [r, g, b, a] = color;
    const { x: ox, y: oy } = tile.getOffset();
    const { TILE_SIZE } = this;
    const { width, data } = this.image;

    for (let dy = 0; dy < TILE_SIZE; dy++) {
      const y = oy + dy;
      if (y >= this.getHeight()) break;
      let i = (y * width + ox) * 4; // 行頭インデックス
      for (let dx = 0; dx < TILE_SIZE; dx++) {
        const x = ox + dx;
        if (x >= this.getWidth()) break;

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
        i += 4;
      }
    }

    if (collectDiff)
      this.addDiffs([
        {
          kind: 'tile',
          index,
          beforeColor: tile.uniformColor,
          afterColor: [r, g, b, a],
        },
      ]);

    // 状態更新
    tile.isDirty = tile.isDirty = true;
    tile.isDirty = tile.isDirtyThroughAction = true;
    tile.isUniform = true;
    tile.uniformColor = color;
  }

  public deletePixel(
    position: Vec2,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    const result = this.deletePixelInPosition(position, excludePositionMatch, excludeColorMatch);
    if (result !== undefined) {
      const tileIndex = this.getTileIndex(position);
      this.tiles[tileIndex.row][tileIndex.column].isDirty = true;
      this.tiles[tileIndex.row][tileIndex.column].isDirtyThroughAction = true;
    }
    return result;
  }

  public getPixel(position: Vec2): RGBAColor {
    const i = (position.y * this.image.width + position.x) * 4;
    const d = this.image.data;

    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  }

  public getTileRowCount() {
    return this.tiles.length;
  }

  public getTileColumnCount() {
    return this.tiles[0].length;
  }

  public isTileInBounds(index: TileIndex) {
    return (
      index.row >= 0 &&
      index.row < this.getTileRowCount() &&
      index.column >= 0 &&
      index.column < this.getTileColumnCount()
    );
  }
}
