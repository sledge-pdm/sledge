import { transparent } from '@sledge/anvil';
import { ToolArgs, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.ERASER;
  forceColor = transparent;

  onStart(args: ToolArgs): ToolResult {
    return super.onStart(args);
  }

  onMove(args: ToolArgs): ToolResult {
    return super.onMove(args);
  }

  onRawMove(args: ToolArgs): ToolResult {
    return super.onRawMove(args);
  }

  onEnd(args: ToolArgs): ToolResult {
    return super.onEnd(args);
  }

  onCancel(args: ToolArgs): ToolResult {
    return super.onCancel(args);
  }
}
