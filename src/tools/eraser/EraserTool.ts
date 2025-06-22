import LayerImageAgent from '~/controllers/layer/image/managers/LayerImageAgent';
import { ToolArgs } from '~/tools/ToolBehavior';
import { transparent } from '~/utils/ColorUtils';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  onlyOnCanvas = true;

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return super.draw(agent, args, transparent);
  }
}
