import { HistoryContext } from '~/features/history/types';
import { HistoryCommand } from '../command/HistoryCommand';
import { HistoryEntry } from './HistoryEntry';

export type CommandLine = {
  command: HistoryCommand;
  undoOrder?: number;
  redoOrder?: number;
};

type CommandInput = HistoryCommand | HistoryCommand[] | CommandLine | CommandLine[];

type OrderedCommand = {
  command: HistoryCommand;
  undoOrder: number;
  redoOrder: number;
  index: number;
};

const isCommandLine = (value: HistoryCommand | CommandLine): value is CommandLine => {
  return (value as CommandLine).command !== undefined;
};

export class CommandsHistoryEntry extends HistoryEntry {
  private readonly undoCommands: HistoryCommand[];
  private readonly redoCommands: HistoryCommand[];

  constructor(
    input: CommandInput,
    private context?: HistoryContext
  ) {
    super();
    const normalized = this.normalizeCommands(input);
    this.undoCommands = this.sortByOrder(normalized, 'undoOrder');
    this.redoCommands = this.sortByOrder(normalized, 'redoOrder');
  }

  undo(): void {
    for (const command of this.undoCommands) {
      command.backward();
    }
  }

  redo(): void {
    for (const command of this.redoCommands) {
      command.forward();
    }
  }

  getContext(): HistoryContext[] {
    if (this.context) {
      return [this.context];
    } else {
      return this.undoCommands.map((command) => command.getContext());
    }
  }

  private normalizeCommands(input: CommandInput): OrderedCommand[] {
    const raw = Array.isArray(input) ? input : [input];
    const length = raw.length;
    return raw.map((item, index) => {
      const line = isCommandLine(item) ? item : { command: item };
      return {
        command: line.command,
        // Keep legacy behavior for HistoryCommand[]: undo is reverse, redo is forward.
        undoOrder: line.undoOrder ?? length - index,
        redoOrder: line.redoOrder ?? index,
        index,
      };
    });
  }

  private sortByOrder(commands: OrderedCommand[], orderKey: 'undoOrder' | 'redoOrder'): HistoryCommand[] {
    return [...commands]
      .sort((a, b) => {
        const diff = a[orderKey] - b[orderKey];
        if (diff !== 0) return diff;
        return a.index - b.index;
      })
      .map((item) => item.command);
  }
}
