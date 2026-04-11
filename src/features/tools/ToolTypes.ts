import { ToolBehavior } from '~/features/tools/behaviors/ToolBehavior';

export const DEFAULT_PRESET = 'default';

export const TOOL_CATEGORIES = {
  PEN: 'pen',
  ERASER: 'eraser',
  FILL: 'fill',
  PIPETTE: 'pipette',
  RECT_SELECTION: 'rectSelection',
  AUTO_SELECTION: 'autoSelection',
  LASSO_SELECTION: 'lassoSelection',
  MOVE: 'move',
} as const;

export const TOOLS_ALLOWED_IN_MOVE_MODE: ToolCategoryId[] = [TOOL_CATEGORIES.MOVE];

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];

export type ToolCategory<TPresetConfig = any> = {
  id: ToolCategoryId;
  name: string;
  iconSrc?: string;
  behavior: ToolBehavior;
  presets?: ToolPresets<TPresetConfig>;
};

export type ToolPresets<TConfig = any> = {
  selected: string;
  options: Record<string, TConfig>;
};

export type PresetConfig = {
  size?: number;
};

export type PenPresetConfig = PresetConfig & {
  shape?: 'circle' | 'square';
  sizeHistory?: number[];
  opacity?: number;
};

export type EraserPresetConfig = PresetConfig & {
  shape?: 'circle' | 'square';
  sizeHistory?: number[];
  opacity?: number;
};

export type FillPresetConfig = PresetConfig & {
  threshold?: number;
  selectionFillMode?: 'area' | 'inside' | 'ignore';
};

export type AutoSelectionPresetConfig = PresetConfig & {
  threshold?: number;
};

export type RectSelectionPresetConfig = PresetConfig & {};

export type LassoSelectionPresetConfig = PresetConfig & {
  fillMode?: 'nonzero' | 'evenodd';
};
