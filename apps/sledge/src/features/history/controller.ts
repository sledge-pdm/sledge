import {
  AnvilLayerHistoryAction,
  CanvasSizeHistoryAction,
  ColorHistoryAction,
  ImagePoolHistoryAction,
  LayerListHistoryAction,
  LayerMergeHistoryAction,
  LayerPropsHistoryAction,
} from '~/features/history/actions';
import { globalConfig } from '~/stores/GlobalStores';
import { setProjectStore } from '~/stores/ProjectStores';
import { BaseHistoryAction, SerializedHistoryAction } from './base';

export class ProjectHistoryController {
  private undoStack: BaseHistoryAction[] = [];
  private redoStack: BaseHistoryAction[] = [];
  private listeners: Set<(state: { canUndo: boolean; canRedo: boolean; lastLabel?: string }) => void> = new Set();

  getUndoStack(): BaseHistoryAction[] {
    return this.undoStack;
  }
  getRedoStack(): BaseHistoryAction[] {
    return this.redoStack;
  }

  getSerialized(): {
    undoStack: SerializedHistoryAction[];
    redoStack: SerializedHistoryAction[];
  } {
    return {
      undoStack: this.undoStack.map((action) => action.serialize()),
      redoStack: this.redoStack.map((action) => action.serialize()),
    };
  }

  setSerialized(undoStack: SerializedHistoryAction[], redoStack: SerializedHistoryAction[]): void {
    this.undoStack = undoStack
      .map((serialized) => {
        const action = this.deserialize(serialized);
        return action;
      })
      .filter((a): a is BaseHistoryAction => a !== undefined);
    this.redoStack = redoStack
      .map((serialized) => {
        const action = this.deserialize(serialized);
        return action;
      })
      .filter((a): a is BaseHistoryAction => a !== undefined);
  }

  deserialize(serialized: SerializedHistoryAction): BaseHistoryAction | undefined {
    try {
      switch (serialized.type) {
        case 'canvas_size':
          return new CanvasSizeHistoryAction(serialized.props as any);
        case 'color':
          return new ColorHistoryAction(serialized.props as any);
        case 'image_pool':
          return new ImagePoolHistoryAction(serialized.props as any);
        case 'layer_buffer':
          return new AnvilLayerHistoryAction(serialized.props as any);
        case 'layer_list':
          return new LayerListHistoryAction(serialized.props as any);
        case 'layer_merge':
          return new LayerMergeHistoryAction(serialized.props as any);
        case 'layer_props':
          return new LayerPropsHistoryAction(serialized.props as any);
      }
      return undefined;
    } catch (e) {
      console.error('Error deserializing history action:', e);
      return undefined;
    }
  }

  addAction(action: BaseHistoryAction): void {
    if (this.undoStack.length >= globalConfig.editor.maxHistoryItemsCount) {
      // just shift() to maintain the size after max count changed
      this.undoStack.shift();
    }
    this.undoStack.push(action);
    this.redoStack = [];
    this.emitChange();
  }
  undo(): void {
    const action = this.undoStack.pop();
    if (action) {
      action.undo();
      this.redoStack.push(action);
      this.emitChange();
    }
  }
  redo(): void {
    const action = this.redoStack.pop();
    if (action) {
      action.redo();
      this.undoStack.push(action);
      this.emitChange();
    }
  }
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  onChange(listener: (s: { canUndo: boolean; canRedo: boolean; lastLabel?: string }) => void): () => void {
    this.listeners.add(listener);
    listener({ canUndo: this.canUndo(), canRedo: this.canRedo(), lastLabel: this.undoStack[this.undoStack.length - 1]?.label });
    return () => this.listeners.delete(listener);
  }
  clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
  }
  isHistoryAvailable() {
    return this.canUndo() || this.canRedo();
  }
  private emitChange() {
    const lastLabel = this.undoStack[this.undoStack.length - 1]?.label;
    const snap = { canUndo: this.canUndo(), canRedo: this.canRedo(), lastLabel };
    this.listeners.forEach((l) => l(snap));
    setProjectStore('isProjectChangedAfterSave', true);
  }
}
export const projectHistoryController = new ProjectHistoryController();
