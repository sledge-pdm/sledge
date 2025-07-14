import { TileIndex } from '~/controllers/layer/image/managers/Tile';
import { RGBAColor } from '~/utils/ColorUtils';
import { eventBus } from '~/utils/EventBus';
import { Vec2 } from '../../../../../packages/core/src/Vector';

export type PixelDiff = {
  kind: 'pixel';
  position: Vec2;
  before: RGBAColor;
  after: RGBAColor;
};

export type TileDiff = {
  kind: 'tile';
  index: TileIndex;
  beforeColor: RGBAColor | undefined;
  afterColor: RGBAColor;
};

export type Diff = PixelDiff | TileDiff;

export const getDiffHash = (diff: Diff) => {
  switch (diff.kind) {
    case 'pixel':
      return `px:${diff.position.x},${diff.position.y}`;
    case 'tile':
      return `tile:${diff.index.row},${diff.index.column}`;
  }
};

export type DiffAction = {
  diffs: Map<string, Diff>;
};

export class HistoryManager {
  protected undoActionsStack: DiffAction[] = [];
  protected redoActionsStack: DiffAction[] = [];
  private readonly maxStackSize = 50;

  constructor(public layerId: string) {}

  public getUndoStack() {
    return this.undoActionsStack;
  }

  public getRedoStack() {
    return this.redoActionsStack;
  }

  public canUndo() {
    return this.undoActionsStack.length > 0;
  }

  public canRedo() {
    return this.redoActionsStack.length > 0;
  }

  public addAction(action: DiffAction) {
    console.log(`add action to history for layer ${this.layerId}.`, action);
    // push new action and cap undo history
    this.undoActionsStack.push(action);
    if (this.undoActionsStack.length > this.maxStackSize) {
      this.undoActionsStack.shift();
    }
    // clear redo history
    this.redoActionsStack = [];

    eventBus.emit('layerHistory:changed', {});
  }

  public undo(): DiffAction | undefined {
    const undoedAction = this.undoActionsStack.pop();
    console.log(`undo action to history for layer ${this.layerId}.`, undoedAction);
    if (!undoedAction) return undefined;

    // push to redo and cap redo history
    this.redoActionsStack.unshift(undoedAction);
    if (this.redoActionsStack.length > this.maxStackSize) {
      this.redoActionsStack.pop();
    }

    eventBus.emit('layerHistory:changed', {});

    return undoedAction;
  }

  public redo(): DiffAction | undefined {
    const redoedAction = this.redoActionsStack.shift();
    console.log(`redo action to history for layer ${this.layerId}.`, redoedAction);
    if (!redoedAction) return undefined;

    // push back to undo and cap undo history
    this.undoActionsStack.push(redoedAction);
    if (this.undoActionsStack.length > this.maxStackSize) {
      this.undoActionsStack.shift();
    }

    eventBus.emit('layerHistory:changed', {});

    return redoedAction;
  }
}
