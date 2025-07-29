import { EraserTool } from '~/tools/draw/eraser/EraserTool';
import { FillTool } from '~/tools/draw/fill/FillTool';
import { PenTool } from '~/tools/draw/pen/PenTool';
import { MoveTool } from '~/tools/move/MoveTool';
import { PipetteTool } from '~/tools/pipette/PipetteTool';
import { RectSelection } from '~/tools/selection/rect/RectSelection';
import { SelectionMoveTool } from '~/tools/selection/selection_move/SelectionMoveTool';
import { ToolBehavior } from '~/tools/ToolBehavior';

export const DEFAULT_PRESET = 'default';

export const TOOL_CATEGORIES = {
  PEN: 'pen',
  ERASER: 'eraser',
  FILL: 'fill',
  PIPETTE: 'pipette',
  RECT_SELECTION: 'rectSelection',
  SELECTION_MOVE: 'selectionMove',
  MOVE: 'move',
} as const;

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

// ツール別のプリセット設定型
export type PenPresetConfig = {
  size?: number;
  // shape?: 'circle' | 'square';
  // opacity?: number;
};

export type EraserPresetConfig = {
  size?: number;
  // shape?: 'circle' | 'square';
  // hardness?: number;
};

export type FillPresetConfig = {
  // threshold?: number;
  // antialias?: boolean;
};

// ツールカテゴリの定義
export const toolCategories = {
  [TOOL_CATEGORIES.PEN]: {
    id: TOOL_CATEGORIES.PEN,
    name: 'Pen',
    iconSrc: '/icons/tool_bar/tool/pen.png',
    behavior: new PenTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: { size: 1 } as PenPresetConfig,
        fine: { size: 1 } as PenPresetConfig,
        thick: { size: 5 } as PenPresetConfig,
        square: { size: 3 } as PenPresetConfig,
      },
    },
  } as ToolCategory<PenPresetConfig>,
  [TOOL_CATEGORIES.ERASER]: {
    id: TOOL_CATEGORIES.ERASER,
    name: 'Eraser',
    iconSrc: '/icons/tool_bar/tool/eraser.png',
    behavior: new EraserTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: { size: 1 } as EraserPresetConfig,
      },
    },
  } as ToolCategory<EraserPresetConfig>,
  [TOOL_CATEGORIES.FILL]: {
    id: TOOL_CATEGORIES.FILL,
    name: 'Fill',
    iconSrc: '/icons/tool_bar/tool/fill.png',
    behavior: new FillTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: {} as FillPresetConfig,
      },
    },
  } as ToolCategory<FillPresetConfig>,
  [TOOL_CATEGORIES.PIPETTE]: {
    id: TOOL_CATEGORIES.PIPETTE,
    name: 'Pipette',
    iconSrc: '/icons/tool_bar/tool/pipette.png',
    behavior: new PipetteTool(),
    // プリセット不要
  } as ToolCategory,
  [TOOL_CATEGORIES.RECT_SELECTION]: {
    id: TOOL_CATEGORIES.RECT_SELECTION,
    name: 'Rect Select',
    iconSrc: '/icons/tool_bar/tool/rectselect.png',
    behavior: new RectSelection(),
    // プリセット不要
  } as ToolCategory,
  [TOOL_CATEGORIES.SELECTION_MOVE]: {
    id: TOOL_CATEGORIES.SELECTION_MOVE,
    name: 'Selection Move',
    iconSrc: '/icons/tool_bar/tool/move_area.png',
    behavior: new SelectionMoveTool(),
    // プリセット不要
  } as ToolCategory,
  [TOOL_CATEGORIES.MOVE]: {
    id: TOOL_CATEGORIES.MOVE,
    name: 'Move',
    iconSrc: '/icons/tool_bar/tool/move.png',
    behavior: new MoveTool(),
    // プリセット不要
  } as ToolCategory,
} as const;
