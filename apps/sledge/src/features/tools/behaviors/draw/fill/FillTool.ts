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
import { ToolArgs, ToolBehavior } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf } from '~/features/tools/ToolController';

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

  onStart({ position, color, presetName, layerId }: ToolArgs) {
    const startTime = Date.now();

    const preset = presetName ? (getPresetOf('fill', presetName) as any) : undefined;
    const threshold = preset?.threshold ?? 0;
    const limitMode = getSelectionLimitMode();

    const before = getBufferCopy(layerId);

    const selectionFillMode = preset.selectionFillMode ?? 'inside';
    if (!isSelectionAvailable() || selectionFillMode === 'ignore') {
      floodFill({
        target: getBufferPointer(layerId)!,
        targetWidth: getLayerWidth(layerId)!,
        targetHeight: getLayerHeight(layerId)!,
        fillColor: color,
        startX: position.x,
        startY: position.y,
        threshold,
      });
    } else {
      const selectionMask = selectionManager.getSelectionMask();
      if (selectionFillMode === 'inside') {
        floodFill({
          target: getBufferPointer(layerId)!,
          targetWidth: getLayerWidth(layerId)!,
          targetHeight: getLayerHeight(layerId)!,
          fillColor: color,
          startX: position.x,
          startY: position.y,
          threshold,
          mask: {
            buffer: selectionMask.getMask(),
            mode: 'inside',
          },
        });
      } else {
        const maskBuffer = selectionMask.getMask();
        const target = getBufferPointer(layerId)!;
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

    if (before) registerWholeChange(layerId, before);

    const endTime = Date.now();

    return {
      result: `Flood Fill done. (in ${endTime - startTime} ms)`,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onMove(args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(args: ToolArgs) {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
