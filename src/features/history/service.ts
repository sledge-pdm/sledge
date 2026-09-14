import { HistoryContext } from '@sledge-pdm/core';
import { isBusy } from '~/features/busy';
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

/**
 * @description undo and redo rewrite the very layers and stacks an operation in flight is reading, so they
 *   are refused for as long as one holds the window. the guard is here rather than at each button and
 *   shortcut, so a call site added later is covered without being remembered.
 */
function canStepHistory(): boolean {
  if (!isBusy()) return true;
  logUserWarn('cannot undo or redo while an operation is running.');
  return false;
}

export function tryUndo() {
  if (!canStepHistory()) return;
  if (historyManager.canUndo()) {
    historyManager.undo();
  } else {
    logUserWarn('Nothing to undo.');
  }
}

export function tryRedo() {
  if (!canStepHistory()) return;
  if (historyManager.canRedo()) {
    historyManager.redo();
  } else {
    logUserWarn('Nothing to redo.');
  }
}
