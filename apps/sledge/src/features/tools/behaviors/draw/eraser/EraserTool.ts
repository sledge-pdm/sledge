import { transparent } from '@sledge/anvil';
import { Consts } from '~/Consts';
import { ToolArgs, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf, updateToolPresetConfig } from '~/features/tools/ToolController';
import { DEFAULT_PRESET, EraserPresetConfig, TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.ERASER;

  onStart(args: ToolArgs): ToolResult {
    // register to history if it's new size
    const preset = getPresetOf(TOOL_CATEGORIES.ERASER, args.presetName ?? DEFAULT_PRESET) as EraserPresetConfig;
    const history: number[] = preset.sizeHistory ?? [];
    if (preset.size && !history.includes(preset.size)) {
      const newHistory = [preset.size, ...history].slice(0, Consts.maxSizeHistoryLength);
      updateToolPresetConfig(TOOL_CATEGORIES.ERASER, args.presetName ?? DEFAULT_PRESET, 'sizeHistory', newHistory);
    }

    return super.draw(args, transparent);
  }

  onMove(args: ToolArgs): ToolResult {
    return super.draw(args, transparent);
  }

  onEnd(args: ToolArgs): ToolResult {
    return super.onEnd(args);
  }

  onCancel(args: ToolArgs): ToolResult {
    return super.onCancel(args);
  }
}
