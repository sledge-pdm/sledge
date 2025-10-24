import { KeyConfigEntry } from '~/config/KeyConfig';
import { isMacOS } from '~/utils/OSUtils';

export type KeyConfigCommands =
  | 'save'
  | 'undo'
  | 'redo'
  | 'zoom_in'
  | 'zoom_out'
  | 'pen'
  | 'eraser'
  | 'fill'
  | 'rect_select'
  | 'auto_select'
  | 'lasso_select'
  | 'move'
  | 'pipette'
  | 'sizeIncrease'
  | 'sizeDecrease';

export type KeyConfigStore = {
  [command in KeyConfigCommands]: KeyConfigEntry[];
};

const KEY_CONFIG_TEMPLATE_DEFAULT: Readonly<KeyConfigStore> = {
  save: [{ ctrl: true, key: 's' }],
  undo: [{ ctrl: true, key: 'z' }],
  redo: [{ ctrl: true, key: 'y' }],
  zoom_in: [
    { shift: false, key: '+' },
    { shift: true, key: '+' },
  ],
  zoom_out: [{ key: '-' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  rect_select: [{ key: 'r' }],
  auto_select: [{ key: 'a' }],
  lasso_select: [{ key: 'l' }],
  move: [{ key: 'm' }],
  pipette: [{ alt: true }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
} as const;

const KEY_CONFIG_TEMPLATE_MAC: Readonly<KeyConfigStore> = {
  save: [{ meta: true, key: 's' }],
  undo: [{ meta: true, key: 'z' }],
  redo: [{ meta: true, key: 'y' }],
  zoom_in: [
    { shift: false, key: '+' },
    { shift: true, key: '+' },
  ],
  zoom_out: [{ key: '-' }],
  pen: [{ key: 'p' }],
  eraser: [{ key: 'e' }],
  fill: [{ key: 'f' }],
  rect_select: [{ key: 'r' }],
  auto_select: [{ key: 'a' }],
  lasso_select: [{ key: 'l' }],
  move: [{ key: 'm' }],
  pipette: [{ alt: true }],
  sizeIncrease: [{ key: ']' }],
  sizeDecrease: [{ key: '[' }],
} as const;

export const makeDefaultKeyConfigStore = (): KeyConfigStore => {
  return structuredClone(isMacOS() ? KEY_CONFIG_TEMPLATE_MAC : KEY_CONFIG_TEMPLATE_DEFAULT);
};
