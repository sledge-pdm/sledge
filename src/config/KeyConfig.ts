import { isMacOS } from '~/utils/OSUtils';

export type KeyConfigEntry = {
  key?: string; // 例: "z", "x", "ArrowUp"
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // MacのCommandキーなど
};

export type KeyConfigCommands =
  | 'save'
  | 'undo'
  | 'redo'
  | 'zoom_in'
  | 'zoom_out'
  | 'layer_clear'
  | 'layer_delete'
  | 'layer_duplicate'
  | 'layer_toggle_visibility'
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
  layer_clear: [{ ctrl: true, shift: true, key: 'k' }],
  layer_delete: [{ key: 'Delete' }],
  layer_duplicate: [{ ctrl: true, shift: true, key: 'd' }],
  layer_toggle_visibility: [{ ctrl: true, shift: true, key: 'h' }],
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
  layer_clear: [{ meta: true, shift: true, key: 'k' }],
  layer_delete: [{ key: 'Delete' }],
  layer_duplicate: [{ meta: true, shift: true, key: 'd' }],
  layer_toggle_visibility: [{ meta: true, shift: true, key: 'h' }],
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
