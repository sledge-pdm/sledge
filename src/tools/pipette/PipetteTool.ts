import { setCurrentColor } from '~/controllers/color/ColorController';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import ToolArgs from '~/tools/ToolArgs';
import ToolBehavior from '~/tools/ToolBehavior';
import { RGBAColor, RGBToHex, transparent } from '~/utils/ColorUtils';

export class PipetteTool implements ToolBehavior {
  private color: RGBAColor = transparent;

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    this.color = agent.getPixelBufferManager().getPixel(args.position);
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    this.color = agent.getPixelBufferManager().getPixel(args.position);
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    setCurrentColor(`#${RGBToHex([this.color[0], this.color[1], this.color[2]])}`);
    return false;
  }
}
