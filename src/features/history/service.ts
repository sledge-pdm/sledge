import { HistoryCommand } from './command/HistoryCommand';
import { CommandLine, CommandsHistoryEntry } from './entry/CommandsHistoryEntry';
import { historyManager } from './HistoryManager';

type CommandInput = HistoryCommand | HistoryCommand[] | CommandLine | CommandLine[];

const isCommandLine = (value: HistoryCommand | CommandLine): value is CommandLine => {
  return (value as CommandLine).command !== undefined;
};

const executeCommands = (input: CommandInput) => {
  const list = Array.isArray(input) ? input : [input];
  for (const item of list) {
    const command = isCommandLine(item) ? item.command : item;
    command.forward();
  }
};

export function doCommands(commands: CommandInput, register?: boolean) {
  executeCommands(commands);
  if (register) historyManager.addEntry(new CommandsHistoryEntry(commands));
}

export function doCommandsWithRegister(commands: CommandInput) {
  executeCommands(commands);
  historyManager.addEntry(new CommandsHistoryEntry(commands));
}
