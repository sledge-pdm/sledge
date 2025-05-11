import { setBottomBarText } from '~/controllers/log/LogController';
import { HistoryManager, PixelDiff, TileDiff } from '~/models/history/HistoryManager';
import DiffManager from '~/models/layer/image/DiffManager';
import PixelBufferManager from '~/models/layer/image/PixelBuffer';
import { Size2D } from '~/types/Size';
import { TileIndex } from '~/types/Tile';
import { Vec2 } from '~/types/Vector';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import TileManager from '../../../models/layer/image/TileManager';

interface ImageChangeEvent {
  newSize?: Size2D;
}

// それぞれのLayerCanvasの描画、表示までの処理過程を記述するクラス
export default class LayerImageAgent {
  protected pbm: PixelBufferManager;
  protected tm: TileManager;
  protected dm: DiffManager;
  protected hm: HistoryManager;

  protected onImageChangedListeners: {
    [key: string]: (e: ImageChangeEvent) => void;
  } = {};

  getPixelBufferManager() {
    return this.pbm;
  }
  getHistoryManager() {
    return this.hm;
  }
  getTileManager() {
    return this.tm;
  }
  getDiffManager() {
    return this.dm;
  }

  getWidth = (): number => this.pbm.width;
  getHeight = (): number => this.pbm.height;

  constructor(
    private layerId: string,
    buffer: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    this.dm = new DiffManager();
    this.pbm = new PixelBufferManager(buffer, width, height);
    this.tm = new TileManager(
      width,
      height,
      (position: Vec2) => this.pbm.getPixel(position),
      (i: number, v: number) => (this.pbm.buffer[i] = v),
      (index: TileIndex, uniformColor: RGBAColor | undefined, fillColor: RGBAColor) =>
        this.dm.add({
          kind: 'tile',
          index,
          beforeColor: uniformColor,
          afterColor: fillColor,
        })
    );
    this.hm = new HistoryManager(layerId);
  }

  getBuffer() {
    return this.pbm.buffer;
  }

  setBuffer(rawBuffer: Uint8ClampedArray, silentlySet: boolean = false) {
    this.pbm.buffer = rawBuffer;
    if (!silentlySet) this.callOnImageChangeListeners({});
    this.tm.initTile();
  }

  changeBufferSize(newSize: Size2D) {
    this.pbm.changeSize(newSize);
    this.tm.setSize(newSize);
    this.callOnImageChangeListeners({ newSize });
  }

  setOnImageChangeListener(key: string, listener: (e: ImageChangeEvent) => void) {
    this.onImageChangedListeners[key] = listener;
  }
  removeOnImageChangeListener(key: string) {
    delete this.onImageChangedListeners[key];
  }
  clearOnImageChangeListener(key: string) {
    delete this.onImageChangedListeners[key];
  }
  callOnImageChangeListeners(e: ImageChangeEvent) {
    Object.values(this.onImageChangedListeners).forEach((listener) => listener(e));
  }

  protected undoTileDiff(tileDiff: TileDiff): void {
    if (tileDiff.beforeColor) this.tm.fillWholeTile(tileDiff.index, tileDiff.beforeColor, false);
  }

  protected redoTileDiff(tileDiff: TileDiff): void {
    this.tm.fillWholeTile(tileDiff.index, tileDiff.afterColor, false);
  }

  public registerToHistory() {
    if (this.dm.getCurrent().diffs.size !== 0) {
      this.hm.addAction(this.dm.getCurrent());
    }
    this.dm.reset();
  }

  public canUndo = () => this.hm.canUndo();
  public canRedo = () => this.hm.canRedo();

  public undo() {
    const undoStart = Date.now();
    const undoedAction = this.hm.undo();
    if (undoedAction === undefined) return;
    setBottomBarText(`undo.`);
    undoedAction.diffs.forEach((diff) => {
      switch (diff.kind) {
        case 'pixel':
          this.setPixel(diff.position, diff.before, true);
          break;
        case 'tile':
          this.undoTileDiff(diff);
          break;
      }
    });
    const undoEnd = Date.now();
    setBottomBarText(`undo done. (${undoedAction.diffs.size} px updated, ${undoEnd - undoStart}ms)`);

    this.callOnImageChangeListeners({});
  }

  public redo() {
    const redoStart = Date.now();
    const redoedAction = this.hm.redo();
    if (redoedAction === undefined) return;
    setBottomBarText(`redo.`);
    redoedAction.diffs.forEach((diff) => {
      switch (diff.kind) {
        case 'pixel':
          this.setPixel(diff.position, diff.after, true);
          break;
        case 'tile':
          this.redoTileDiff(diff);
          break;
      }
    });
    const redoEnd = Date.now();
    setBottomBarText(`redo done. (${redoedAction.diffs.size} px updated, ${redoEnd - redoStart}ms)`);

    this.callOnImageChangeListeners({});
  }

  public setPixel(position: Vec2, color: RGBAColor, skipExistingDiffCheck: boolean): PixelDiff | undefined {
    if (!this.pbm.isInBounds(position)) return undefined;
    if (!skipExistingDiffCheck && this.dm.isDiffExists(position)) return undefined;
    const result = this.pbm.setRawPixel(position, color);
    if (result !== undefined) {
      const tileIndex = this.tm.getTileIndex(position);
      this.tm.tiles[tileIndex.row][tileIndex.column].isDirty = true;
      this.tm.tiles[tileIndex.row][tileIndex.column].isDirtyThroughAction = true;

      const tile = this.tm.getTile(tileIndex);
      if (tile.isUniform && tile.uniformColor !== undefined && !colorMatch(tile.uniformColor, color)) {
        this.tm.tiles[tileIndex.row][tileIndex.column].isUniform = false;
        this.tm.tiles[tileIndex.row][tileIndex.column].uniformColor = undefined;
      }
    }
    return result;
  }
}
