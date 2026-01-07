import { isTransparent, RGBA, RGBAToHex, transparent } from '@sledge-pdm/core';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo } from '~/features/log/service';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { interactStore } from '~/stores/EditorStores';

export class PipetteTool implements ToolBehavior {
  isInstantTool = true;

  private color: RGBA = transparent;

  onStart(args: ToolArgs): ToolResult {
    if (!interactStore.isPointerOnCanvas) {
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
    }

    const color = layerManager.readPixelCanvas(args.layerId, args.position.x, args.position.y);
    if (color !== undefined) this.color = color;

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    if (!interactStore.isPointerOnCanvas) {
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
    }

    const color = layerManager.readPixelCanvas(args.layerId, args.position.x, args.position.y);
    if (color !== undefined) this.color = color;

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
      const hex = RGBAToHex(pickColor, { excludeAlpha: !includeAlpha });
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
