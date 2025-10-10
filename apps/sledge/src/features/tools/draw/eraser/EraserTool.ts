import { transparent } from '~/features/color';
import { AnvilToolContext, ToolArgs } from '~/features/tools/ToolBehavior';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.ERASER;

  onStart(ctx: AnvilToolContext, args: ToolArgs) {
    return super.draw(ctx as any, args, transparent);
  }

  onMove(ctx: AnvilToolContext, args: ToolArgs) {
    return super.draw(ctx as any, args, transparent);
  }

  onEnd(ctx: AnvilToolContext, args: ToolArgs) {
    return super.onEnd(ctx as any, args);
  }
}
