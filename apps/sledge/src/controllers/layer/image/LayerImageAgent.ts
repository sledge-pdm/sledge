import { Size2D, Vec2 } from '@sledge/core';
import { TileIndex } from '~/controllers/layer/image/managers/Tile';
import { setBottomBarText } from '~/controllers/log/LogController';
import { HistoryManager, PixelDiff, TileDiff } from '~/models/history/HistoryManager';
import { globalConfig } from '~/stores/GlobalStores';
import { colorMatch, RGBAColor } from '~/utils/ColorUtils';
import { eventBus } from '~/utils/EventBus';
import DiffManager from './managers/DiffManager';
import PixelBufferManager from './managers/PixelBufferManager';
import TileManager from './managers/TileManager';

// それぞれのLayerCanvasの描画、表示までの処理過程を記述するクラス
export default class LayerImageAgent {
  protected pbm: PixelBufferManager;
  protected tm: TileManager;
  protected dm: DiffManager;
  protected hm: HistoryManager;

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
    public layerId: string,
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

  getBuffer(): Uint8ClampedArray {
    return this.pbm.buffer;
  }

  getNonClampedBuffer(): Uint8Array {
    return new Uint8Array(this.pbm.buffer.buffer, this.pbm.buffer.byteOffset, this.pbm.buffer.byteLength);
  }

  setBuffer(rawBuffer: Uint8ClampedArray, silentlySet: boolean = false, updatePreview: boolean = false) {
    this.pbm.buffer = rawBuffer;
    this.tm.setAllDirty();
    if (!silentlySet) {
      eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${this.layerId}) buffer set` });
      if (updatePreview) eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
    }
  }

  forceUpdate() {
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${this.layerId}) force update` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
  }

  changeBufferSize(newSize: Size2D, emitEvent?: boolean) {
    this.pbm.changeSize(newSize);
    this.tm.setSize(newSize);
    if (emitEvent) {
      this.tm.setAllDirty();
      eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${this.layerId}) buffer size changed` });
      eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
    }
    // this.callOnImageChangeListeners({ newSize, updatePreview: true });
  }

  protected undoTileDiff(tileDiff: TileDiff): void {
    if (tileDiff.beforeColor) this.tm.fillWholeTile(tileDiff.index, tileDiff.beforeColor, false);
  }

  protected redoTileDiff(tileDiff: TileDiff): void {
    this.tm.fillWholeTile(tileDiff.index, tileDiff.afterColor, false);
  }

  public registerToHistory() {
    let shouldAddAction = true;
    if (globalConfig.editor.skipMeaninglessAction) {
      if (this.dm.getCurrent().diffs.size === 0) shouldAddAction = false; // meaningless action
    }

    if (shouldAddAction) {
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
        case 'whole':
          this.setBuffer(diff.before, true, false);
          break;
      }
    });
    const undoEnd = Date.now();
    setBottomBarText(`undo done. (${undoedAction.diffs.size} px updated, ${undoEnd - undoStart}ms)`);

    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${this.layerId}) undo` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
    // this.callOnImageChangeListeners({ updatePreview: true });
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
        case 'whole':
          this.setBuffer(diff.after, true, false);
          break;
      }
    });
    const redoEnd = Date.now();
    setBottomBarText(`redo done. (${redoedAction.diffs.size} px updated, ${redoEnd - redoStart}ms)`);

    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${this.layerId}) redo` });
    eventBus.emit('preview:requestUpdate', { layerId: this.layerId });
    // this.callOnImageChangeListeners({ updatePreview: true });
  }

  public setPixel(position: Vec2, color: RGBAColor, skipExistingDiffCheck: boolean): PixelDiff | undefined {
    if (!this.pbm.isInBounds(position)) return undefined;
    if (!skipExistingDiffCheck && this.dm.isDiffExists(position)) return undefined;
    const result = this.pbm.setRawPixel(position, color);
    if (result !== undefined) {
      const tileIndex = this.tm.getTileIndex(position);
      this.tm.tiles[tileIndex.row][tileIndex.column].isDirty = true;

      const tile = this.tm.getTile(tileIndex);
      if (tile.isUniform && tile.uniformColor !== undefined && !colorMatch(tile.uniformColor, color)) {
        this.tm.tiles[tileIndex.row][tileIndex.column].isUniform = false;
        this.tm.tiles[tileIndex.row][tileIndex.column].uniformColor = undefined;
      }
    }
    return result;
  }
}
