import './command/registerAll';
import { deserializeHistoryCommand, SerializedHistoryCommand, serializeHistoryCommand } from './command/registry';
import { CommandLine, CommandsHistoryEntry } from './entry/CommandsHistoryEntry';
import { HistoryEntry } from './entry/HistoryEntry';
import { HistoryContext } from './types';

export type SerializedCommandLine = {
  command: SerializedHistoryCommand;
  undoOrder?: number;
  redoOrder?: number;
};

export type SerializedCommandsHistoryEntry = {
  entryType: 'commands';
  commands: SerializedCommandLine[];
  context?: HistoryContext;
};

export type SerializedHistoryEntry = SerializedCommandsHistoryEntry;

export type SerializedHistoryStacks = {
  undoStack: SerializedHistoryEntry[];
  redoStack: SerializedHistoryEntry[];
};

const serializeCommandLine = (line: CommandLine): SerializedCommandLine | undefined => {
  const serialized = serializeHistoryCommand(line.command);
  if (!serialized) return;
  return {
    command: serialized,
    undoOrder: line.undoOrder,
    redoOrder: line.redoOrder,
  };
};

const deserializeCommandLine = (line: SerializedCommandLine): CommandLine | undefined => {
  const command = deserializeHistoryCommand(line.command);
  if (!command) return;
  return {
    command,
    undoOrder: line.undoOrder,
    redoOrder: line.redoOrder,
  };
};

export const serializeHistoryEntry = (entry: HistoryEntry): SerializedHistoryEntry | undefined => {
  if (entry instanceof CommandsHistoryEntry) {
    const commands = entry
      .getCommandLines()
      .map((line) => serializeCommandLine(line))
      .filter((line): line is SerializedCommandLine => line !== undefined);
    return {
      entryType: 'commands',
      commands,
      context: entry.getContextOverride(),
    };
  }
  return;
};

export const deserializeHistoryEntry = (entry: SerializedHistoryEntry): HistoryEntry | undefined => {
  if (entry.entryType !== 'commands') return;
  const commands = entry.commands.map((line) => deserializeCommandLine(line)).filter((line): line is CommandLine => line !== undefined);
  return new CommandsHistoryEntry(commands, entry.context);
};

export const serializeHistoryStacks = (undoStack: HistoryEntry[], redoStack: HistoryEntry[]): SerializedHistoryStacks => {
  return {
    undoStack: undoStack.map((entry) => serializeHistoryEntry(entry)).filter((entry): entry is SerializedHistoryEntry => entry !== undefined),
    redoStack: redoStack.map((entry) => serializeHistoryEntry(entry)).filter((entry): entry is SerializedHistoryEntry => entry !== undefined),
  };
};

const isSerializedHistoryEntry = (value: unknown): value is SerializedHistoryEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as SerializedHistoryEntry;
  return entry.entryType === 'commands' && Array.isArray(entry.commands);
};

export const deserializeHistoryStacks = (raw: { undoStack?: unknown[]; redoStack?: unknown[] }): SerializedHistoryStacks => {
  const undo = (raw.undoStack ?? []).filter(isSerializedHistoryEntry);
  const redo = (raw.redoStack ?? []).filter(isSerializedHistoryEntry);
  return { undoStack: undo, redoStack: redo };
};

export const inflateHistoryStacks = (raw: { undoStack?: unknown[]; redoStack?: unknown[] }): { undo: HistoryEntry[]; redo: HistoryEntry[] } => {
  const { undoStack, redoStack } = deserializeHistoryStacks(raw);
  const undo = undoStack.map((entry) => deserializeHistoryEntry(entry)).filter((entry): entry is HistoryEntry => entry !== undefined);
  const redo = redoStack.map((entry) => deserializeHistoryEntry(entry)).filter((entry): entry is HistoryEntry => entry !== undefined);
  return { undo, redo };
};
