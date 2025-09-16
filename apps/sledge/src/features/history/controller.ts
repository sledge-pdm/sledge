import { globalConfig } from '~/stores/GlobalStores';
import { BaseHistoryAction } from './base';

export class ProjectHistoryController {
  private undoStack: BaseHistoryAction[] = [];
  private redoStack: BaseHistoryAction[] = [];
  private listeners: Set<(state: { canUndo: boolean; canRedo: boolean; lastLabel?: string }) => void> = new Set();

  // Provide read-only snapshots for UI (do not mutate returned arrays!)
  getUndoStack(): BaseHistoryAction[] {
    return this.undoStack;
  }
  getRedoStack(): BaseHistoryAction[] {
    return this.redoStack;
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
  }
}
export const projectHistoryController = new ProjectHistoryController();
