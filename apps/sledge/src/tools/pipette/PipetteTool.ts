import { setCurrentColor } from '~/controllers/color/ColorController';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { isTransparent, RGBAColor, RGBToHex, transparent } from '~/utils/ColorUtils';

export class PipetteTool implements ToolBehavior {
  onlyOnCanvas = true;
  isInstantTool = true;

  private color: RGBAColor = transparent;

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    const color = agent.getPixelBufferManager().getPixel(args.position);
    if (!isTransparent(color)) {
      this.color = color;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const color = agent.getPixelBufferManager().getPixel(args.position);
    if (!isTransparent(color)) {
      this.color = color;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    if (!isTransparent(this.color)) {
      setCurrentColor(`#${RGBToHex([this.color[0], this.color[1], this.color[2]])}`);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: !args.event?.shiftKey,
    };
  }

  onCancel(agent: LayerImageAgent, args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: true,
    };
  }
}
