import { describe, expect, it } from 'vitest';
import { HistoryCommand } from '~/features/history/command/HistoryCommand';
import { SetActiveLayerCommand } from '~/features/history/command/layer_list/SetActiveLayerCommand';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { HistoryEntry } from '~/features/history/entry/HistoryEntry';
import {
  deserializeHistoryEntry,
  deserializeHistoryStacks,
  inflateHistoryStacks,
  serializeHistoryEntry,
  serializeHistoryStacks,
} from '~/features/history/serialization';

class UnknownCommand extends HistoryCommand {
  constructor() {
    super('set_active_layer');
    (this as { type: string }).type = '__not_registered__';
  }

  forward(): void {}

  backward(): void {}

  getContext() {
    return { icon: '/unknown.png', description: 'unknown' };
  }

  serializeProps() {
    return { value: 1 };
  }
}

class UnsupportedEntry extends HistoryEntry {
  undo(): void {}

  redo(): void {}

  getContext() {
    return [];
  }
}

describe('history serialization', () => {
  it('serializes command entries and drops unregistered commands', () => {
    const known = new SetActiveLayerCommand({ layerId: 'layer-1' });
    const unknown = new UnknownCommand();
    const entry = new CommandsHistoryEntry(
      [
        { command: known, undoOrder: 5, redoOrder: 3 },
        { command: unknown, undoOrder: 1, redoOrder: 0 },
      ],
      { icon: '/ctx.png', description: 'ctx' }
    );

    const serialized = serializeHistoryEntry(entry);

    expect(serialized).toBeDefined();
    expect(serialized?.entryType).toBe('commands');
    expect(serialized?.commands).toHaveLength(1);
    expect(serialized?.commands[0].undoOrder).toBe(5);
    expect(serialized?.commands[0].redoOrder).toBe(3);
    expect(serialized?.commands[0].command.type).toBe('set_active_layer');
    expect(serialized?.context).toEqual({ icon: '/ctx.png', description: 'ctx' });
  });

  it('deserializes command entries and filters unknown command types', () => {
    const serialized = {
      entryType: 'commands' as const,
      context: { icon: '/ctx.png', description: 'ctx' },
      commands: [
        {
          command: {
            type: 'set_active_layer',
            props: { layerId: 'layer-2', pastActiveLayerId: 'layer-1' },
          },
          undoOrder: 2,
          redoOrder: 4,
        },
        {
          command: {
            type: '__unknown__',
            props: {},
          },
          undoOrder: 1,
          redoOrder: 0,
        },
      ],
    };

    const entry = deserializeHistoryEntry(serialized);
    expect(entry).toBeInstanceOf(CommandsHistoryEntry);

    const lines = (entry as CommandsHistoryEntry).getCommandLines();
    expect(lines).toHaveLength(1);
    expect(lines[0].command.type).toBe('set_active_layer');
    expect(lines[0].undoOrder).toBe(2);
    expect(lines[0].redoOrder).toBe(4);
  });

  it('serializes stacks and drops unsupported history entries', () => {
    const known = new SetActiveLayerCommand({ layerId: 'layer-a' });
    const supported = new CommandsHistoryEntry(known);
    const unsupported = new UnsupportedEntry();

    const serialized = serializeHistoryStacks([supported, unsupported], [unsupported]);

    expect(serialized.undoStack).toHaveLength(1);
    expect(serialized.redoStack).toHaveLength(0);
  });

  it('keeps only valid serialized entries shape in deserializeHistoryStacks', () => {
    const raw = {
      undoStack: [{ entryType: 'commands', commands: [] }, { entryType: 'invalid', commands: [] }, undefined],
      redoStack: [{ entryType: 'commands', commands: [1, 2, 3] }],
    };

    const deserialized = deserializeHistoryStacks(raw);
    expect(deserialized.undoStack).toHaveLength(1);
    expect(deserialized.redoStack).toHaveLength(1);
  });

  it('inflates stacks into runtime entries', () => {
    const raw = {
      undoStack: [
        {
          entryType: 'commands',
          commands: [
            {
              command: { type: 'set_active_layer', props: { layerId: 'layer-x' } },
              undoOrder: 1,
              redoOrder: 0,
            },
          ],
        },
      ],
      redoStack: [
        {
          entryType: 'commands',
          commands: [
            {
              command: { type: '__missing__', props: {} },
              undoOrder: 0,
              redoOrder: 0,
            },
          ],
        },
      ],
    };

    const inflated = inflateHistoryStacks(raw);
    expect(inflated.undo).toHaveLength(1);
    expect(inflated.redo).toHaveLength(1);
    expect((inflated.undo[0] as CommandsHistoryEntry).getCommandLines()).toHaveLength(1);
    expect((inflated.redo[0] as CommandsHistoryEntry).getCommandLines()).toHaveLength(0);
  });
});
