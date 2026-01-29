// New history management system.

import { setIOStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { HistoryEntry } from './entry/HistoryEntry';

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners: Set<(state: { canUndo: boolean; canRedo: boolean; lastLabel?: string }) => void> = new Set();

  getUndoStack(): HistoryEntry[] {
    return this.undoStack;
  }

  getRedoStack(): HistoryEntry[] {
    return this.redoStack;
  }

  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;
    entry.undo();
    this.redoStack.push(entry);
    this.emitChange();
  }

  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    entry.redo();
    this.undoStack.push(entry);
    this.emitChange();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  onChange(listener: (s: { canUndo: boolean; canRedo: boolean }) => void): () => void {
    this.listeners.add(listener);
    listener({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    return () => this.listeners.delete(listener);
  }

  addEntry(entry: HistoryEntry): void {
    if (this.undoStack.length >= globalConfig.editor.maxHistoryItemsCount) {
      // just shift() to maintain the size after max count changed
      this.undoStack.shift();
    }
    this.undoStack.push(entry);
    this.redoStack = [];
    this.emitChange();
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.emitChange();
  }

  setStacks(undoStack: HistoryEntry[], redoStack: HistoryEntry[], options?: { emit?: boolean; markDirty?: boolean }): void {
    this.undoStack = undoStack;
    this.redoStack = redoStack;
    const emit = options?.emit ?? true;
    if (emit) {
      this.emitChange(options?.markDirty ?? true);
    }
  }

  private emitChange(markDirty = true) {
    const snap = { canUndo: this.canUndo(), canRedo: this.canRedo() };
    this.listeners.forEach((l) => l(snap));
    if (markDirty) setIOStore('isProjectChangedAfterSave', true);
  }
}

export const historyManager = new HistoryManager();
