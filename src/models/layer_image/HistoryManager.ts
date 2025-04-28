import { reconcile } from 'solid-js/store';
import { TileIndex } from '~/types/Tile';
import { RGBAColor } from '~/utils/colorUtils';
import { Vec2 } from '../../types/Vector';
import { setLayerHistoryStore } from '~/stores/ProjectStores';

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
    // push new action and cap undo history
    this.undoActionsStack.push(action);
    if (this.undoActionsStack.length > this.maxStackSize) {
      this.undoActionsStack.shift();
    }
    // clear redo history
    this.redoActionsStack = [];

    this.syncStores();
  }

  public undo(): DiffAction | undefined {
    const undoedAction = this.undoActionsStack.pop();
    if (!undoedAction) return undefined;

    // push to redo and cap redo history
    this.redoActionsStack.unshift(undoedAction);
    if (this.redoActionsStack.length > this.maxStackSize) {
      this.redoActionsStack.pop();
    }

    this.syncStores();
    return undoedAction;
  }

  public redo(): DiffAction | undefined {
    const redoedAction = this.redoActionsStack.shift();
    if (!redoedAction) return undefined;

    // push back to undo and cap undo history
    this.undoActionsStack.push(redoedAction);
    if (this.undoActionsStack.length > this.maxStackSize) {
      this.undoActionsStack.shift();
    }

    this.syncStores();
    return redoedAction;
  }

  /**
   * Synchronize the undo/redo stacks with the SolidJS store
   */
  private syncStores() {
    setLayerHistoryStore(
      this.layerId,
      'undoStack',
      reconcile(this.undoActionsStack)
    );
    setLayerHistoryStore(
      this.layerId,
      'redoStack',
      reconcile(this.redoActionsStack)
    );
  }
}
