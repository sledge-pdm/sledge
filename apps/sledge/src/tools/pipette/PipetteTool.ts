import { isTransparent, RGBAColor, RGBToHex, setCurrentColor, transparent } from '~/features/color';
import { AnvilToolContext, ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export class PipetteTool implements ToolBehavior {
  onlyOnCanvas = true;
  isInstantTool = true;

  private color: RGBAColor = transparent;

  onStart(ctx: AnvilToolContext, args: ToolArgs) {
    const c = ctx.getPixel(args.position.x, args.position.y) as RGBAColor | undefined;
    if (c && !isTransparent(c)) {
      this.color = c;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(ctx: AnvilToolContext, args: ToolArgs) {
    const c = ctx.getPixel(args.position.x, args.position.y) as RGBAColor | undefined;
    if (c && !isTransparent(c)) {
      this.color = c;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(_ctx: AnvilToolContext, args: ToolArgs) {
    if (!isTransparent(this.color)) {
      setCurrentColor(`#${RGBToHex([this.color[0], this.color[1], this.color[2]])}`);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: !args.event?.shiftKey,
    };
  }

  onCancel(_ctx: AnvilToolContext, _args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: true,
    };
  }
}
