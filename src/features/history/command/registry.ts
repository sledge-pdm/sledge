import { SerializedHistoryCommand } from '@sledge-pdm/core';
import { HistoryCommand, HistoryCommandType } from './HistoryCommand';

type CommandDeserializer = (props: unknown) => HistoryCommand;
type CommandSerializer = (command: HistoryCommand) => SerializedHistoryCommand;

const registry = new Map<HistoryCommandType, { deserialize: CommandDeserializer; serialize?: CommandSerializer }>();

export const registerHistoryCommand = (type: HistoryCommandType, deserialize: CommandDeserializer, serialize?: CommandSerializer) => {
  registry.set(type, { deserialize, serialize });
};

export const serializeHistoryCommand = (command: HistoryCommand): SerializedHistoryCommand | undefined => {
  const entry = registry.get(command.type);
  if (!entry) return;
  const serialize = entry.serialize ?? ((cmd: HistoryCommand) => ({ type: cmd.type, props: cmd.serializeProps() }));
  return serialize(command);
};

export const deserializeHistoryCommand = (serialized: SerializedHistoryCommand): HistoryCommand | undefined => {
  const entry = registry.get(serialized.type as unknown as HistoryCommandType);
  if (!entry) return;
  return entry.deserialize(serialized.props);
};
