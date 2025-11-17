import { isTransparent, RGBA, transparent } from '@sledge/anvil';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';

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
