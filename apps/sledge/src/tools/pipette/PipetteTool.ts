import { setCurrentColor } from '~/controllers/color/ColorController';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { getPrevActiveToolCategory, setActiveToolCategory } from '~/controllers/tool/ToolController';
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

      // Shiftが押されていなければ前のツールに戻る
      const prevTool = getPrevActiveToolCategory();
      if (!args.event?.shiftKey && prevTool) {
        setActiveToolCategory(prevTool);
      }
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
