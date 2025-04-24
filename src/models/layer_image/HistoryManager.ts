import { reconcile } from "solid-js/store";
import { setLayerImageStore } from "~/stores/project/layerImageStore";
import { RGBAColor } from "~/utils/colorUtils";
import { Vec2 } from "../types/Vector";
import { TileIndex } from "./Tile";

export type PixelDiff = {
  kind: "pixel";
  position: Vec2;
  before: RGBAColor;
  after: RGBAColor;
};

export type TileDiff = {
  kind: "tile";
  index: TileIndex;
  beforeColor: RGBAColor | undefined;
  afterColor: RGBAColor;
};

export type Diff = PixelDiff | TileDiff;

export const getDiffHash = (diff: Diff) => {
  switch (diff.kind) {
    case "pixel":
      return `px:${diff.position.x},${diff.position.y}`;
    case "tile":
      return `tile:${diff.index.row},${diff.index.column}`;
  }
};

export type DiffAction = {
  diffs: Map<string, Diff>;
};

export class HistoryManager {
  protected undoActionsStack: DiffAction[];
  protected redoActionsStack: DiffAction[];

  constructor(public layerId: string) {
    this.undoActionsStack = [];
    this.redoActionsStack = [];
  }

  public getUndoStack() {
    return this.undoActionsStack;
  }

  public getRedoStack() {
    return this.undoActionsStack;
  }

  public canUndo() {
    return this.undoActionsStack.length > 0;
  }

  public canRedo() {
    return this.redoActionsStack.length > 0;
  }

  public addAction(action: DiffAction) {
    this.undoActionsStack.push(action);
    this.redoActionsStack = [];
    setLayerImageStore(
      this.layerId,
      "undoStack",
      reconcile(this.undoActionsStack),
    );
    setLayerImageStore(
      this.layerId,
      "redoStack",
      reconcile(this.redoActionsStack),
    );
  }

  public undo(): DiffAction | undefined {
    const undoedAction = this.undoActionsStack.pop();
    if (undoedAction === undefined) return undefined;
    this.redoActionsStack = [undoedAction, ...this.redoActionsStack];
    setLayerImageStore(
      this.layerId,
      "undoStack",
      reconcile(this.undoActionsStack),
    );
    setLayerImageStore(
      this.layerId,
      "redoStack",
      reconcile(this.redoActionsStack),
    );
    return undoedAction;
  }

  public redo(): DiffAction | undefined {
    const redoedAction = this.redoActionsStack.shift();
    if (redoedAction === undefined) return undefined;
    this.undoActionsStack = [...this.undoActionsStack, redoedAction];
    setLayerImageStore(
      this.layerId,
      "undoStack",
      reconcile(this.undoActionsStack),
    );
    setLayerImageStore(
      this.layerId,
      "redoStack",
      reconcile(this.redoActionsStack),
    );
    return redoedAction;
  }
}
