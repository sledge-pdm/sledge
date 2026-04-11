import { EraserTool } from '~/features/tools/behaviors/draw/eraser/EraserTool';
import { FillTool } from '~/features/tools/behaviors/draw/fill/FillTool';
import { PenTool } from '~/features/tools/behaviors/draw/pen/PenTool';
import { MoveTool } from '~/features/tools/behaviors/move/MoveTool';
import { PipetteTool } from '~/features/tools/behaviors/pipette/PipetteTool';
import { AutoSelection } from '~/features/tools/behaviors/selection/auto/AutoSelection';
import { LassoSelection } from '~/features/tools/behaviors/selection/lasso/LassoSelection';
import { RectSelection } from '~/features/tools/behaviors/selection/rect/RectSelection';
import {
  AutoSelectionPresetConfig,
  DEFAULT_PRESET,
  EraserPresetConfig,
  FillPresetConfig,
  LassoSelectionPresetConfig,
  PenPresetConfig,
  RectSelectionPresetConfig,
  TOOL_CATEGORIES,
  ToolCategory,
} from '~/features/tools/ToolTypes';

export const toolCategories = {
  [TOOL_CATEGORIES.PEN]: {
    id: TOOL_CATEGORIES.PEN,
    name: 'Pen',
    iconSrc: '/assets/icons/tools/pen.png',
    behavior: new PenTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: { size: 1, shape: 'circle', opacity: 100 } as PenPresetConfig,
      },
    },
  } as ToolCategory<PenPresetConfig>,
  [TOOL_CATEGORIES.ERASER]: {
    id: TOOL_CATEGORIES.ERASER,
    name: 'Eraser',
    iconSrc: '/assets/icons/tools/eraser.png',
    behavior: new EraserTool(),
    presets: {
      selected: DEFAULT_PRESET,
      options: {
        [DEFAULT_PRESET]: { size: 1, shape: 'circle', opacity: 100 } as EraserPresetConfig,
      },
    },
  } as ToolCategory<EraserPresetConfig>,
  [TOOL_CATEGORIES.FILL]: {
    id: TOOL_CATEGORIES.FILL,
    name: 'Fill',
    iconSrc: '/assets/icons/tools/fill.png',
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
    iconSrc: '/assets/icons/tools/pipette.png',
    behavior: new PipetteTool(),
  } as ToolCategory,
  [TOOL_CATEGORIES.RECT_SELECTION]: {
    id: TOOL_CATEGORIES.RECT_SELECTION,
    name: 'Rect Select',
    iconSrc: '/assets/icons/tools/rect_select.png',
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
    iconSrc: '/assets/icons/tools/auto_select.png',
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
    iconSrc: '/assets/icons/tools/lasso_select.png',
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
    iconSrc: '/assets/icons/tools/move.png',
    behavior: new MoveTool(),
  } as ToolCategory,
} as const;
