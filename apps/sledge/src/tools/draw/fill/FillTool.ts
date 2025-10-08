import { floodFill } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';
// LayerImageAgent 依存を除去し AnvilToolContext を利用
//import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';
import {
  getBufferCopy,
  getBufferPointer,
  getHeight as getLayerHeight,
  getWidth as getLayerWidth,
  registerWholeChange,
} from '~/features/layer/anvil/AnvilController';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { getSelectionLimitMode, isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { getPresetOf } from '~/features/tool/ToolController';
import { AnvilToolContext, ToolArgs, ToolBehavior } from '~/tools/ToolBehavior';

export interface FillProps {
  layerId: string;
  color: RGBAColor;
  position: Vec2;
  threshold?: number;
}
export interface Fill {
  fill: (props: FillProps) => void;
}

export class FillTool implements ToolBehavior {
  onlyOnCanvas = true;

  onStart(ctx: AnvilToolContext, { position, color, presetName, layerId }: ToolArgs) {
    const startTime = Date.now();

    // Restrict by selection (a little bit harsh, so currently commented out)
    //
    // if (!isDrawingAllowed(position, true)) {
    //   setBottomBarText('Click inside selection.', { kind: 'warn' });

    //   return {
    //     shouldUpdate: false,
    //     shouldRegisterToHistory: false,
    //   };
    // }

    const preset = presetName ? (getPresetOf('fill', presetName) as any) : undefined;
    const threshold = preset?.threshold ?? 0;
    const limitMode = getSelectionLimitMode();

    const before = getBufferCopy(ctx.layerId);

    // 選択範囲がない、または制限モードがnoneの場合は通常のフラッドフィル
    if (!isSelectionAvailable()) {
      floodFill({
        target: getBufferPointer(ctx.layerId)!,
        targetWidth: getLayerWidth(ctx.layerId)!,
        targetHeight: getLayerHeight(ctx.layerId)!,
        fillColor: color,
        startX: position.x,
        startY: position.y,
        threshold,
      });
    } else {
      const selectionMask = selectionManager.getSelectionMask();
      const fillMode = preset.fillMode ?? 'area';
      if (fillMode === 'inside') {
        floodFill({
          target: getBufferPointer(ctx.layerId)!,
          targetWidth: getLayerWidth(ctx.layerId)!,
          targetHeight: getLayerHeight(ctx.layerId)!,
          fillColor: color,
          startX: position.x,
          startY: position.y,
          threshold,
          maskBuffer: selectionMask.getMask(),
          maskMode: limitMode,
        });
      } else {
        const maskBuffer = selectionMask.getMask();
        const target = getBufferPointer(ctx.layerId)!;
        for (let i = 0; i < maskBuffer.length; i++) {
          const isInSelection = maskBuffer[i] === 1;
          if (isInSelection) {
            const bufferIndex = i * 4;
            target[bufferIndex] = color[0]; // R
            target[bufferIndex + 1] = color[1]; // G
            target[bufferIndex + 2] = color[2]; // B
            target[bufferIndex + 3] = color[3]; // A
          }
        }
      }
    }

    const after = getBufferCopy(ctx.layerId);
    if (before && after) registerWholeChange(ctx.layerId, before, after);

    const endTime = Date.now();

    return {
      result: `Flood Fill done. (in ${endTime - startTime} ms)`,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onMove(ctx: AnvilToolContext, args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(ctx: AnvilToolContext, args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
