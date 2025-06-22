import { setCurrentColor } from '~/controllers/color/ColorController';
import LayerImageAgent from '~/controllers/layer/image/managers/LayerImageAgent';
import { getPrevActiveToolType, setActiveToolType } from '~/controllers/tool/ToolController';
import { ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';
import { isTransparent, RGBAColor, RGBToHex, transparent } from '~/utils/ColorUtils';

export class PipetteTool implements ToolBehavior {
  onlyOnCanvas = true;

  private color: RGBAColor = transparent;

  onStart(agent: LayerImageAgent, args: ToolArgs) {
    const color = agent.getPixelBufferManager().getPixel(args.position);
    if (!isTransparent(color)) {
      this.color = color;
    }
    return false;
  }

  onMove(agent: LayerImageAgent, args: ToolArgs) {
    const color = agent.getPixelBufferManager().getPixel(args.position);
    if (!isTransparent(color)) {
      this.color = color;
    }
    return false;
  }

  onEnd(agent: LayerImageAgent, args: ToolArgs) {
    if (isTransparent(this.color)) return false;

    setCurrentColor(`#${RGBToHex([this.color[0], this.color[1], this.color[2]])}`);

    // Shiftが押されていなければ前のツールに戻る
    const prevTool = getPrevActiveToolType();
    if (!args.event?.shiftKey && prevTool) {
      setActiveToolType(prevTool);
    }

    return false;
  }
}
