import { isTransparent, RGBA, RGBAToHex, transparent } from '@sledge-pdm/core';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo } from '~/features/log/service';
import {
  completeColorSelectionPick,
  getColorSelectionPreviewColor,
  isColorSelectionPicking,
  shouldRestoreToolAfterColorSelectionPick,
} from '~/features/selection/color_selection';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { interactStore } from '~/stores/EditorStores';

export class PipetteTool implements ToolBehavior {
  isInstantTool = true;

  private color: RGBA = transparent;

  private sampleColor(args: ToolArgs): RGBA | undefined {
    if (!interactStore.isPointerOnCanvas) return undefined;
    if (isColorSelectionPicking()) {
      return getColorSelectionPreviewColor(args.position.x, args.position.y);
    }
    return layerManager.readPixelCanvas(args.layerId, args.position.x, args.position.y);
  }

  onStart(args: ToolArgs): ToolResult {
    this.color = transparent;
    const color = this.sampleColor(args);
    if (color !== undefined) this.color = color;

    return {
      shouldUpdate: false,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    const color = this.sampleColor(args);
    if (color !== undefined) this.color = color;

    return {
      shouldUpdate: false,
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    if (isColorSelectionPicking()) {
      const picked = !isTransparent(this.color) ? ([this.color[0], this.color[1], this.color[2], this.color[3]] as RGBA) : undefined;
      const keepPicking = !!args.event?.shiftKey;
      const shouldReturnToPrevTool = !keepPicking && shouldRestoreToolAfterColorSelectionPick();
      completeColorSelectionPick(picked, { keepPicking });
      return {
        shouldUpdate: false,
        shouldReturnToPrevTool,
      };
    }

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
      shouldReturnToPrevTool: !args.event?.shiftKey,
    };
  }

  onCancel(__args: ToolArgs): ToolResult {
    if (isColorSelectionPicking()) {
      const shouldReturnToPrevTool = shouldRestoreToolAfterColorSelectionPick();
      completeColorSelectionPick(undefined, { keepPicking: false });
      return {
        shouldUpdate: false,
        shouldReturnToPrevTool,
      };
    }

    return {
      shouldUpdate: false,
      shouldReturnToPrevTool: true,
    };
  }
}
