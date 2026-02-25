import { describe, expect, it } from 'vitest';
import { type CommandLine, CommandsHistoryEntry } from '~/features/history';
import { HistoryCommand } from '~/features/history/command/HistoryCommand';

class FakeCommand extends HistoryCommand {
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

describe('CommandsHistoryEntry', () => {
  it('uses reverse undo and forward redo order for plain command arrays', () => {
    const calls: string[] = [];
    const a = new FakeCommand('a', calls);
    const b = new FakeCommand('b', calls);
    const c = new FakeCommand('c', calls);
    const entry = new CommandsHistoryEntry([a, b, c]);

    entry.redo();
    entry.undo();

    expect(calls).toEqual(['forward:a', 'forward:b', 'forward:c', 'backward:c', 'backward:b', 'backward:a']);
  });

  it('sorts by explicit undoOrder/redoOrder and keeps index order on ties', () => {
    const calls: string[] = [];
    const c1 = new FakeCommand('c1', calls);
    const c2 = new FakeCommand('c2', calls);
    const c3 = new FakeCommand('c3', calls);
    const lines: CommandLine[] = [
      { command: c1, undoOrder: 2, redoOrder: 1 },
      { command: c2, undoOrder: 1, redoOrder: 2 },
      { command: c3, undoOrder: 1, redoOrder: 1 },
    ];
    const entry = new CommandsHistoryEntry(lines);

    entry.redo();
    entry.undo();

    expect(calls).toEqual(['forward:c1', 'forward:c3', 'forward:c2', 'backward:c2', 'backward:c3', 'backward:c1']);
  });

  it('returns context override when given', () => {
    const calls: string[] = [];
    const a = new FakeCommand('a', calls);
    const entry = new CommandsHistoryEntry(a, { icon: '/ctx.png', description: 'ctx' });

    expect(entry.getContext()).toEqual([{ icon: '/ctx.png', description: 'ctx' }]);
  });

  it('returns normalized command lines with derived orders', () => {
    const calls: string[] = [];
    const a = new FakeCommand('a', calls);
    const b = new FakeCommand('b', calls);
    const entry = new CommandsHistoryEntry([a, b]);
    const lines = entry.getCommandLines();

    expect(lines).toHaveLength(2);
    expect(lines[0].command).toBe(a);
    expect(lines[0].redoOrder).toBe(0);
    expect(lines[0].undoOrder).toBe(2);
    expect(lines[1].command).toBe(b);
    expect(lines[1].redoOrder).toBe(1);
    expect(lines[1].undoOrder).toBe(1);
  });
});
