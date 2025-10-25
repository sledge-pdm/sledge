import { isTransparent, RGBAColor, RGBToHex, setCurrentColor, transparent } from '~/features/color';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { ToolArgs, ToolBehavior } from '~/features/tools/behaviors/ToolBehavior';

export class PipetteTool implements ToolBehavior {
  onlyOnCanvas = true;
  isInstantTool = true;

  private color: RGBAColor = transparent;

  onStart(args: ToolArgs) {
    const anvil = getAnvilOf(args.layerId);
    const c = anvil?.getPixel(args.position.x, args.position.y) as RGBAColor | undefined;
    if (c && !isTransparent(c)) {
      this.color = c;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(args: ToolArgs) {
    const anvil = getAnvilOf(args.layerId);
    const c = anvil?.getPixel(args.position.x, args.position.y) as RGBAColor | undefined;
    if (c && !isTransparent(c)) {
      this.color = c;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(args: ToolArgs) {
    if (!isTransparent(this.color)) {
      setCurrentColor(`#${RGBToHex([this.color[0], this.color[1], this.color[2]])}`);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: !args.event?.shiftKey,
    };
  }

  onCancel(__args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: true,
    };
  }
}
