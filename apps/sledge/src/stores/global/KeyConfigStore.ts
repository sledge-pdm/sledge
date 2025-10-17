import { KeyConfigCommands } from '~/Consts';
import { KeyConfigEntry } from '~/config/KeyConfig';
import { isMacOS } from '~/utils/OSUtils';

export type KeyConfigStore = {
  [command in KeyConfigCommands]: KeyConfigEntry[];
};

const KEY_CONFIG_TEMPLATE_DEFAULT: Readonly<KeyConfigStore> = {
  save: [{ ctrl: true, key: 's' }],
  undo: [{ ctrl: true, key: 'z' }],
  redo: [{ ctrl: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  rect_select: [{ key: 'r' }],
  auto_select: [{ key: 'a' }],
  move: [{ key: 'm' }],
  pipette: [{ alt: true }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
} as const;

const KEY_CONFIG_TEMPLATE_MAC: Readonly<KeyConfigStore> = {
  save: [{ meta: true, key: 's' }],
  undo: [{ meta: true, key: 'z' }],
  redo: [{ meta: true, key: 'y' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  rect_select: [{ key: 'r' }],
  auto_select: [{ key: 'a' }],
  move: [{ key: 'm' }],
  pipette: [{ alt: true }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
} as const;

export const makeDefaultKeyConfigStore = (): KeyConfigStore => {
  return structuredClone(isMacOS() ? KEY_CONFIG_TEMPLATE_MAC : KEY_CONFIG_TEMPLATE_DEFAULT);
};
