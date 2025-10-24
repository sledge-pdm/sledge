import { transparent } from '~/features/color';
import { ToolArgs } from '~/features/tools/behaviors/ToolBehavior';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.ERASER;

  onStart(args: ToolArgs) {
    return super.draw(args, transparent);
  }

  onMove(args: ToolArgs) {
    return super.draw(args, transparent);
  }

  onEnd(args: ToolArgs) {
    return super.onEnd(args);
  }
}
