import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { ToolArgs } from '~/tools/ToolBehavior';
import { transparent } from '~/utils/ColorUtils';
import { PenTool } from '../pen/PenTool';

export class EraserTool extends PenTool {
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    return super.draw(agent, args, transparent);
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    return super.draw(agent, args, transparent);
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    return super.onEnd(agent, args);
  }
}
