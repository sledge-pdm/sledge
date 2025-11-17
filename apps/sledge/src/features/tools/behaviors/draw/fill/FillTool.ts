import { RGBA } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
// LayerImageAgent 依存を除去し AnvilToolContext を利用
//import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf } from '~/features/tools/ToolController';
import { FillPresetConfig } from '~/features/tools/Tools';

export interface FillProps {
  layerId: string;
  color: RGBA;
  position: Vec2;
  threshold?: number;
}
export interface Fill {
  fill: (props: FillProps) => void;
}

export class FillTool implements ToolBehavior {
  onlyOnCanvas = true;

  onStart({ position, color, presetName, layerId }: ToolArgs): ToolResult {
    const startTime = Date.now();

    const preset = presetName ? (getPresetOf('fill', presetName) as FillPresetConfig) : undefined;
    if (!preset)
      return {
        shouldRegisterToHistory: false,
        shouldUpdate: false,
      };
    const threshold = preset.threshold ?? 0;
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
        //inside
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
        //area
        anvil.fillWithMaskArea({
          mask: selectionMask.getMask(),
          color,
        });
      }
    }

    const endTime = Date.now();

    return {
      result: `Flood Fill done. (in ${endTime - startTime} ms)`,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
