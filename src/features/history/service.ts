import { HistoryContext } from '@sledge-pdm/core';
import { logUserWarn } from '../log';
import { HistoryCommand } from './command/HistoryCommand';
import { CommandLine, CommandsHistoryEntry } from './entry/CommandsHistoryEntry';
import { historyManager } from './HistoryManager';

export type HistoryCommandsInput = HistoryCommand | HistoryCommand[] | CommandLine | CommandLine[];

const isCommandLine = (value: HistoryCommand | CommandLine): value is CommandLine => {
  return (value as CommandLine).command !== undefined;
};

export const executeCommands = (input: HistoryCommandsInput) => {
  const list = Array.isArray(input) ? input : [input];
  for (const item of list) {
    const command = isCommandLine(item) ? item.command : item;
    command.forward();
  }
};

export interface RegisterCommandsOption {
  context?: HistoryContext;
}

export function registerCommandsHistory(commands: HistoryCommandsInput, options?: RegisterCommandsOption) {
  historyManager.addEntry(new CommandsHistoryEntry(commands, options?.context));
}

export interface DoCommandsOption {
  register?: boolean;
  context?: HistoryContext;
}

export function doCommands(commands: HistoryCommandsInput, options?: DoCommandsOption) {
  const { register = true, context = undefined } = options ?? {};
  executeCommands(commands);
  if (register) registerCommandsHistory(commands, { context });
}

export function tryUndo() {
  if (historyManager.canUndo()) {
    historyManager.undo();
  } else {
    logUserWarn('Nothing to undo.');
  }
}

export function tryRedo() {
  if (historyManager.canRedo()) {
    historyManager.redo();
  } else {
    logUserWarn('Nothing to redo.');
  }
}
