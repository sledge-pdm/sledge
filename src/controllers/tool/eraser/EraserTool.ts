import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { transparent } from '~/utils/ColorUtils';
import { ToolArgs } from '../../../models/tool/ToolBase';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return super.draw(agent, args, transparent);
  }
}
