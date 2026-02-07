import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryCommand } from '~/features/history/command/HistoryCommand';
import { historyManager } from '~/features/history/HistoryManager';
import { doCommands, tryRedo, tryUndo } from '~/features/history/service';

class TestCommand extends HistoryCommand {
  constructor(
    private readonly id: string,
    private readonly calls: string[]
  ) {
    super('set_active_layer');
  }

  forward(): void {
    this.calls.push(`forward:${this.id}`);
  }

  backward(): void {
    this.calls.push(`backward:${this.id}`);
  }

  getContext() {
    return { icon: '/test.png', description: this.id };
  }

  serializeProps() {
    return { id: this.id };
  }
}

describe('history service', () => {
  beforeEach(() => {
    historyManager.clearHistory();
  });

  it('executes commands without registration when register is false', () => {
    const calls: string[] = [];
    const c1 = new TestCommand('c1', calls);
    doCommands(c1, { register: false });

    expect(calls).toEqual(['forward:c1']);
    expect(historyManager.getUndoStack()).toHaveLength(0);
  });

  it('registers command lines and respects custom undo/redo order', () => {
    const calls: string[] = [];
    const a = new TestCommand('a', calls);
    const b = new TestCommand('b', calls);

    doCommands(
      [
        { command: a, undoOrder: 2, redoOrder: 1 },
        { command: b, undoOrder: 1, redoOrder: 2 },
      ],
      { register: true }
    );
    expect(calls).toEqual(['forward:a', 'forward:b']);
    expect(historyManager.canUndo()).toBe(true);

    historyManager.undo();
    expect(calls).toEqual(['forward:a', 'forward:b', 'backward:b', 'backward:a']);

    historyManager.redo();
    expect(calls).toEqual(['forward:a', 'forward:b', 'backward:b', 'backward:a', 'forward:a', 'forward:b']);
  });

  it('tryUndo and tryRedo apply available history entries', () => {
    const calls: string[] = [];
    const cmd = new TestCommand('x', calls);
    doCommands(cmd);

    tryUndo();
    expect(historyManager.canRedo()).toBe(true);
    expect(calls).toEqual(['forward:x', 'backward:x']);

    tryRedo();
    expect(historyManager.canUndo()).toBe(true);
    expect(calls).toEqual(['forward:x', 'backward:x', 'forward:x']);
  });

  it('tryUndo and tryRedo no-op when no history exists', () => {
    expect(historyManager.canUndo()).toBe(false);
    expect(historyManager.canRedo()).toBe(false);

    tryUndo();
    tryRedo();

    expect(historyManager.canUndo()).toBe(false);
    expect(historyManager.canRedo()).toBe(false);
  });
});
