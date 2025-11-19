import { isTransparent, RGBA, RGBAToHex, transparent } from '@sledge/anvil';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { logUserInfo } from '~/features/log/service';

export class PipetteTool implements ToolBehavior {
  onlyOnCanvas = true;
  isInstantTool = true;

  private color: RGBA = transparent;

  onStart(args: ToolArgs): ToolResult {
    const anvil = getAnvil(args.layerId);
    const c = anvil.getPixel(args.position.x, args.position.y) as RGBA;
    if (!isTransparent(c)) {
      this.color = c;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    const anvil = getAnvil(args.layerId);
    const c = anvil.getPixel(args.position.x, args.position.y) as RGBA;
    if (!isTransparent(c)) {
      this.color = c;
    }
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    if (!isTransparent(this.color)) {
      const pickColor: RGBA = [this.color[0], this.color[1], this.color[2], this.color[3]];
      registerColorChange(currentColor(), pickColor);
      setCurrentColor(pickColor);
      const includeAlpha = pickColor[3] !== 255;
      const hex = RGBAToHex(pickColor, { includeAlpha });
      logUserInfo(`Color picked #${hex}`);
    }

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: !args.event?.shiftKey,
    };
  }

  onCancel(__args: ToolArgs): ToolResult {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
      shouldReturnToPrevTool: true,
    };
  }
}
