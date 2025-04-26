import {
  Diff,
  DiffAction,
  getDiffHash,
  HistoryManager,
  PixelDiff,
  TileDiff,
} from './HistoryManager';
import { setBottomInfo } from '~/components/BottomInfo';
import { Vec2 } from '~/types/Vector';
import { colorMatch, RGBAColor } from '~/utils/colorUtils';

interface DrawingBufferChangeEvent {}
interface ImageChangeEvent {}

// それぞれのLayerCanvasの描画、表示までの処理過程を記述するクラス
export default abstract class LayerImageAgent {
  protected image: ImageData;
  protected drawingBuffer: ImageData | undefined;
  protected historyManager;

  protected onImageChangedListeners: {
    [key: string]: (e: ImageChangeEvent) => void;
  } = {};
  protected onDrawingBufferChangedListeners: {
    [key: string]: (e: DrawingBufferChangeEvent) => void;
  } = {};

  constructor(imageData: ImageData, historyManager?: HistoryManager) {
    this.image = imageData;
    this.drawingBuffer = imageData;
    this.historyManager = historyManager;
  }

  getHistoryManager() {
    return this.historyManager;
  }

  getImage() {
    return this.image;
  }

  setImage(image: ImageData, silentlySet: boolean = false) {
    this.image = image;
    if (!silentlySet) this.callOnImageChangeListeners();
    this.resetDrawingBuffer();
  }

  getDrawingBuffer() {
    return this.drawingBuffer;
  }

  setDrawingBuffer(imageData?: ImageData) {
    this.drawingBuffer = imageData;
    this.callOnDrawingBufferChangeListeners();
  }

  resetDrawingBuffer() {
    this.setDrawingBuffer(this.image);
  }

  abstract putImageInto(ctx: CanvasRenderingContext2D): void;
  abstract putDrawingBufferInto(ctx: CanvasRenderingContext2D): void;

  putImageIntoForce(ctx: CanvasRenderingContext2D) {
    ctx.putImageData(this.image, 0, 0);
  }
  putDrawingBufferIntoForce(ctx: CanvasRenderingContext2D) {
    if (this.drawingBuffer) ctx.putImageData(this.drawingBuffer, 0, 0);
  }

  setOnImageChangeListener(key: string, listener: (e: ImageChangeEvent) => void) {
    this.onImageChangedListeners[key] = listener;
  }
  clearOnImageChangeListener(key: string) {
    delete this.onImageChangedListeners[key];
  }

  setOnDrawingBufferChangeListener(key: string, listener: (e: DrawingBufferChangeEvent) => void) {
    this.onDrawingBufferChangedListeners[key] = listener;
  }
  clearOnDrawingBufferChangeListener(key: string) {
    delete this.onDrawingBufferChangedListeners[key];
  }

  callOnImageChangeListeners() {
    console.log('no tnui');
    Object.values(this.onImageChangedListeners).forEach((listener) => listener({}));
  }

  callOnDrawingBufferChangeListeners() {
    Object.values(this.onDrawingBufferChangedListeners).forEach((listener) => listener({}));
  }

  getWidth = (): number => this.image.width;
  getHeight = (): number => this.image.height;

  public currentDiffAction: DiffAction = { diffs: new Map() };

  addDiffs(diffs: Diff[]) {
    diffs.forEach((d) => this.currentDiffAction.diffs.set(getDiffHash(d), d));
  }

  public registerDiffAction() {
    this.historyManager?.addAction(this.currentDiffAction);
    this.currentDiffAction = { diffs: new Map() };
  }

  public canUndo = () => this.historyManager?.canUndo();
  public canRedo = () => this.historyManager?.canRedo();

  public undo() {
    const undoStart = Date.now();
    const undoedAction = this.historyManager?.undo();
    if (undoedAction === undefined) return;
    setBottomInfo(`undo.`);
    undoedAction.diffs.forEach((diff) => {
      switch (diff.kind) {
        case 'pixel':
          this.setPixelInPosition(diff.position, diff.before, false, false);
          break;
        case 'tile':
          this.undoTileDiff(diff);
          break;
      }
    });
    const undoEnd = Date.now();
    setBottomInfo(`undo done. (${undoedAction.diffs.size} px updated, ${undoEnd - undoStart}ms)`);

    this.callOnImageChangeListeners();
  }

  protected undoTileDiff(tileDiff: TileDiff) {}

  public redo() {
    const redoStart = Date.now();
    const redoedAction = this.historyManager?.redo();
    if (redoedAction === undefined) return;
    setBottomInfo(`redo.`);
    redoedAction.diffs.forEach((diff) => {
      switch (diff.kind) {
        case 'pixel':
          this.setPixelInPosition(diff.position, diff.after, false, false);
          break;
        case 'tile':
          this.redoTileDiff(diff);
          break;
      }
    });
    const redoEnd = Date.now();
    setBottomInfo(`redo done. (${redoedAction.diffs.size} px updated, ${redoEnd - redoStart}ms)`);

    this.callOnImageChangeListeners();
  }

  protected redoTileDiff(tileDiff: TileDiff) {}

  public abstract setPixel(
    position: Vec2,
    color: RGBAColor,
    excludePositionMatch: boolean,
    excludeColorMatch: boolean
  ): PixelDiff | undefined;

  protected setPixelInPosition(
    position: Vec2,
    color: RGBAColor,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    if (!this.isInBounds(position)) return undefined;
    if (excludePositionMatch && this.currentDiffAction.diffs.has(`${position.x},${position.y}`))
      return undefined;
    const i = (position.y * this.getWidth() + position.x) * 4;
    const beforeColor: RGBAColor = [
      this.image.data[i + 0],
      this.image.data[i + 1],
      this.image.data[i + 2],
      this.image.data[i + 3],
    ];
    if (excludeColorMatch && colorMatch(beforeColor, color)) return undefined;

    if (!this.drawingBuffer) return;

    this.drawingBuffer.data[i + 0] = color[0];
    this.drawingBuffer.data[i + 1] = color[1];
    this.drawingBuffer.data[i + 2] = color[2];
    this.drawingBuffer.data[i + 3] = color[3];

    return {
      kind: 'pixel',
      position,
      before: beforeColor,
      after: color,
    };
  }

  public abstract deletePixel(
    position: Vec2,
    excludePositionMatch: boolean,
    excludeColorMatch: boolean
  ): PixelDiff | undefined;

  protected deletePixelInPosition(
    position: Vec2,
    excludePositionMatch: boolean = true,
    excludeColorMatch: boolean = true
  ): PixelDiff | undefined {
    return this.setPixelInPosition(position, [0, 0, 0, 0], excludePositionMatch, excludeColorMatch);
  }

  public abstract getPixel(position: Vec2): RGBAColor;

  public isInBounds(position: Vec2) {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < this.getWidth() &&
      position.y < this.getHeight()
    );
  }
}
