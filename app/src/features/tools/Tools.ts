import { EraserTool } from '~/features/tools/behaviors/draw/eraser/EraserTool';
import { FillTool } from '~/features/tools/behaviors/draw/fill/FillTool';
import { PenTool } from '~/features/tools/behaviors/draw/pen/PenTool';
import { MoveTool } from '~/features/tools/behaviors/move/MoveTool';
import { PipetteTool } from '~/features/tools/behaviors/pipette/PipetteTool';
import { AutoSelection } from '~/features/tools/behaviors/selection/auto/AutoSelection';
import { LassoSelection } from '~/features/tools/behaviors/selection/lasso/LassoSelection';
import { RectSelection } from '~/features/tools/behaviors/selection/rect/RectSelection';
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

// 選択範囲の移動中に使えるもの
export const TOOLS_ALLOWED_IN_MOVE_MODE: ToolCategoryId[] = [TOOL_CATEGORIES.MOVE];

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];

export type ToolCategory<TPresetConfig = any> = {
  id: ToolCategoryId;
  name: string;
  iconSrc?: string;
  behavior: ToolBehavior;
  presets?: ToolPresets<TPresetConfig>; // プリセットが必要なカテゴリのみ
};

// プリセット関連の型
export type ToolPresets<TConfig = any> = {
  selected: string;
  options: Record<string, TConfig>;
};

export type PresetConfig = {
  size?: number;
};

// ツール別のプリセット設定型
export type PenPresetConfig = PresetConfig & {
  shape?: 'circle' | 'square';
  sizeHistory?: number[];
  // opacity?: number;
};

export type EraserPresetConfig = PresetConfig & {
  shape?: 'circle' | 'square';
  sizeHistory?: number[];
  // hardness?: number;
};

export type FillPresetConfig = PresetConfig & {
  threshold?: number;
  selectionFillMode?: 'area' | 'inside' | 'ignore';
  // antialias?: boolean;
};

export type AutoSelectionPresetConfig = PresetConfig & {
  threshold?: number;
  // antialias?: boolean;
};

export type RectSelectionPresetConfig = PresetConfig & {};

export type LassoSelectionPresetConfig = PresetConfig & {
  fillMode?: 'nonzero' | 'evenodd';
};

// ツールカテゴリの定義
export const toolCategories = {
  [TOOL_CATEGORIES.PEN]: {
    id: TOOL_CATEGORIES.PEN,
    name: 'Pen',
    iconSrc: '/icons/tools/pen.png',
    behavior: new PenTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: { size: 1, shape: 'circle' } as PenPresetConfig,
      },
    },
  } as ToolCategory<PenPresetConfig>,
  [TOOL_CATEGORIES.ERASER]: {
    id: TOOL_CATEGORIES.ERASER,
    name: 'Eraser',
    iconSrc: '/icons/tools/eraser.png',
    behavior: new EraserTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: { size: 1, shape: 'circle' } as EraserPresetConfig,
      },
    },
  } as ToolCategory<EraserPresetConfig>,
  [TOOL_CATEGORIES.FILL]: {
    id: TOOL_CATEGORIES.FILL,
    name: 'Fill',
    iconSrc: '/icons/tools/fill.png',
    behavior: new FillTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: {
          threshold: 0,
          selectionFillMode: 'inside',
        } as FillPresetConfig,
      },
    },
  } as ToolCategory<FillPresetConfig>,
  [TOOL_CATEGORIES.PIPETTE]: {
    id: TOOL_CATEGORIES.PIPETTE,
    name: 'Pipette',
    iconSrc: '/icons/tools/pipette.png',
    behavior: new PipetteTool(),
    // プリセット不要
  } as ToolCategory,
  [TOOL_CATEGORIES.RECT_SELECTION]: {
    id: TOOL_CATEGORIES.RECT_SELECTION,
    name: 'Rect Select',
    iconSrc: '/icons/tools/rect_select.png',
    behavior: new RectSelection(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: {} as RectSelectionPresetConfig,
      },
    },
  } as ToolCategory,
  [TOOL_CATEGORIES.AUTO_SELECTION]: {
    id: TOOL_CATEGORIES.AUTO_SELECTION,
    name: 'Auto Select',
    iconSrc: '/icons/tools/auto_select.png',
    behavior: new AutoSelection(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: {
          threshold: 0,
        } as AutoSelectionPresetConfig,
      },
    },
  } as ToolCategory<AutoSelectionPresetConfig>,
  [TOOL_CATEGORIES.LASSO_SELECTION]: {
    id: TOOL_CATEGORIES.LASSO_SELECTION,
    name: 'Lasso Select',
    iconSrc: '/icons/tools/lasso_select.png',
    behavior: new LassoSelection(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: {
          fillMode: 'nonzero',
        } as LassoSelectionPresetConfig,
      },
    },
  } as ToolCategory<LassoSelectionPresetConfig>,
  [TOOL_CATEGORIES.MOVE]: {
    id: TOOL_CATEGORIES.MOVE,
    name: 'Move',
    iconSrc: '/icons/tools/move.png',
    behavior: new MoveTool(),
    // プリセット不要
  } as ToolCategory,
} as const;
