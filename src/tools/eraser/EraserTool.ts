import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { transparent } from '~/utils/ColorUtils';
import { PenTool } from '../pen/PenTool';
import ToolArgs from '~/tools/ToolArgs';

export class EraserTool extends PenTool {
  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return super.draw(agent, args, transparent);
  }
}
