import { Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';
// LayerImageAgent 依存を除去し AnvilToolContext を利用
//import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
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
    // const limitMode = getSelectionLimitMode();

    const anvil = getAnvil(layerId);

    anvil.addCurrentWholeDiff();

    const selectionFillMode = preset.selectionFillMode ?? 'inside';
    if (!isSelectionAvailable() || selectionFillMode === 'ignore') {
      anvil.floodFill({
        startX: position.x,
        startY: position.y,
        color,
        threshold,
      });
    } else {
      const selectionMask = selectionManager.getSelectionMask();
      if (selectionFillMode === 'inside') {
        anvil.floodFill({
          startX: position.x,
          startY: position.y,
          color,
          threshold,
          mask: {
            buffer: selectionMask.getMask(),
            mode: 'inside',
          },
        });
      } else {
        const maskBuffer = selectionMask.getMask();
        const buffer = anvil.getBufferHandle();
        for (let i = 0; i < maskBuffer.length; i++) {
          const isInSelection = maskBuffer[i] === 1;
          if (isInSelection) buffer.indexSet(i * 4, color);
        }
      }
    }

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
