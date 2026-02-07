import { describe, expect, it } from 'vitest';
import { HistoryCommand } from '~/features/history/command/HistoryCommand';
import { deserializeHistoryCommand, registerHistoryCommand, serializeHistoryCommand } from '~/features/history/command/registry';

class RegistryTestCommand extends HistoryCommand {
  constructor(private readonly value: number) {
    super('set_active_layer');
    (this as { type: string }).type = '__registry_test__';
  }

  forward(): void {}

  backward(): void {}

  getContext() {
    return { icon: '/registry.png', description: 'registry' };
  }

  serializeProps() {
    return { value: this.value };
  }
}

describe('history command registry', () => {
  it('returns undefined for unregistered command type', () => {
    const command = new RegistryTestCommand(3);
    const serialized = serializeHistoryCommand(command);
    expect(serialized).toBeUndefined();
  });

  it('serializes and deserializes commands through registered handlers', () => {
    const type = '__registry_test__' as any;
    registerHistoryCommand(
      type,
      (props) => new RegistryTestCommand((props as { value: number }).value),
      (command) => ({ type: command.type as any, props: { value: (command as RegistryTestCommand).serializeProps().value } })
    );

    const command = new RegistryTestCommand(9);
    const serialized = serializeHistoryCommand(command);
    expect(serialized).toEqual({
      type: '__registry_test__',
      props: { value: 9 },
    });

    const deserialized = deserializeHistoryCommand(serialized!);
    expect(deserialized).toBeInstanceOf(RegistryTestCommand);
    expect(deserialized?.serializeProps()).toEqual({ value: 9 });
  });
});
