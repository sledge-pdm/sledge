import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';

// new history controller for project-level history
export class ProjectHistoryController {
  private history: BaseHistoryAction[] = [];
  private redoStack: BaseHistoryAction[] = [];
  private listeners: Set<(state: { canUndo: boolean; canRedo: boolean; lastLabel?: string }) => void> = new Set();

  constructor() {
    // Initialize the history controller
  }

  getHistory(): BaseHistoryAction[] {
    return this.history;
  }

  getRedoStack(): BaseHistoryAction[] {
    return this.redoStack;
  }

  addAction(action: BaseHistoryAction): void {
    this.history.push(action);
    this.redoStack = [];
    this.emitChange();
  }

  undo(): void {
    const action = this.history.pop();
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
      this.history.push(action);
      this.emitChange();
    }
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  onChange(listener: (state: { canUndo: boolean; canRedo: boolean; lastLabel?: string }) => void): () => void {
    this.listeners.add(listener);
    // emit initial
    listener({ canUndo: this.canUndo(), canRedo: this.canRedo(), lastLabel: this.history[this.history.length - 1]?.label });
    return () => this.listeners.delete(listener);
  }

  private emitChange() {
    const lastLabel = this.history[this.history.length - 1]?.label;
    const snapshot = { canUndo: this.canUndo(), canRedo: this.canRedo(), lastLabel };
    this.listeners.forEach((l) => l(snapshot));
  }
}

export const projectHistoryController = new ProjectHistoryController();
