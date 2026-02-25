import { TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.ERASER;

  protected ERASER_MODE: boolean = true;
}
