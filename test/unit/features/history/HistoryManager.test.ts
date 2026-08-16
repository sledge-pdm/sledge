import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryEntry } from '~/features/history';
import { HistoryManager } from '~/features/history/HistoryManager';
import { isProjectChanged, markProjectSaved } from '~/stores/EditorStores';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

class TestEntry extends HistoryEntry {
  constructor(
    private readonly id: string,
    private readonly log: string[]
  ) {
    super();
  }

  undo(): void {
    this.log.push(`undo:${this.id}`);
  }

  redo(): void {
    this.log.push(`redo:${this.id}`);
  }

  getContext() {
    return [{ icon: '/test.png', description: this.id }];
  }
}

describe('HistoryManager', () => {
  const initialMax = globalConfig.editor.maxHistoryItemsCount;

  beforeEach(() => {
    markProjectSaved();
    setGlobalConfig('editor', 'maxHistoryItemsCount', initialMax);
  });

  afterEach(() => {
    setGlobalConfig('editor', 'maxHistoryItemsCount', initialMax);
  });

  it('pushes entries, clears redo stack, and marks project dirty', () => {
    const manager = new HistoryManager();
    const listener = vi.fn();
    manager.onChange(listener);

    manager.addEntry(new TestEntry('a', []));

    expect(manager.getUndoStack()).toHaveLength(1);
    expect(manager.getRedoStack()).toHaveLength(0);
    expect(manager.canUndo()).toBe(true);
    expect(isProjectChanged()).toBe(true);
    expect(listener).toHaveBeenCalledWith({ canUndo: true, canRedo: false });
  });

  it('moves entries between undo/redo stacks on undo and redo', () => {
    const manager = new HistoryManager();
    const log: string[] = [];
    manager.addEntry(new TestEntry('x', log));

    manager.undo();
    expect(log).toEqual(['undo:x']);
    expect(manager.getUndoStack()).toHaveLength(0);
    expect(manager.getRedoStack()).toHaveLength(1);

    manager.redo();
    expect(log).toEqual(['undo:x', 'redo:x']);
    expect(manager.getUndoStack()).toHaveLength(1);
    expect(manager.getRedoStack()).toHaveLength(0);
  });

  it('trims oldest undo entry when max history size is reached', () => {
    setGlobalConfig('editor', 'maxHistoryItemsCount', 2);
    const manager = new HistoryManager();
    const log: string[] = [];

    manager.addEntry(new TestEntry('first', log));
    manager.addEntry(new TestEntry('second', log));
    manager.addEntry(new TestEntry('third', log));

    expect(manager.getUndoStack()).toHaveLength(2);

    manager.undo();
    manager.undo();
    expect(log).toEqual(['undo:third', 'undo:second']);
  });

  it('setStacks can skip dirty flag when markDirty is false', () => {
    const manager = new HistoryManager();
    markProjectSaved();

    manager.setStacks([new TestEntry('a', [])], [], { emit: true, markDirty: false });

    expect(manager.canUndo()).toBe(true);
    expect(isProjectChanged()).toBe(false);
  });

  it('clearHistory resets both stacks', () => {
    const manager = new HistoryManager();
    manager.addEntry(new TestEntry('a', []));
    manager.undo();

    manager.clearHistory();

    expect(manager.getUndoStack()).toHaveLength(0);
    expect(manager.getRedoStack()).toHaveLength(0);
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(false);
  });
});
