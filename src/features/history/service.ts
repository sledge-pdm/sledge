import { HistoryContext } from '@sledge-pdm/core';
import { isBusy } from '~/features/busy';
import { exclusiveEditSessionLabels, interruptEditSessions } from '~/features/edit_session';
import { logUserInfo, logUserWarn } from '../log';
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
 *   shortcut, so a call site added later is covered without being remembered - the on-canvas undo and redo
 *   buttons have no check of their own and depend on this one.
 *
 *   an edit the user has open is different from an operation holding the window: it is theirs to end, so
 *   the keypress ends it instead of being refused. stepping history in the same press would do two things
 *   at once - cancel the move and undo whatever came before it - so this press is spent on the
 *   interruption and the next one is the undo.
 */
function canStepHistory(): boolean {
  if (isBusy()) {
    logUserWarn('cannot undo or redo while an operation is running.');
    return false;
  }
  // read the labels first: interrupting closes the sessions, and there is nothing left to name afterwards.
  const labels = exclusiveEditSessionLabels();
  if (interruptEditSessions()) {
    logUserInfo(`${labels.join(', ')} interrupted. press again to step history.`);
    return false;
  }
  return true;
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
