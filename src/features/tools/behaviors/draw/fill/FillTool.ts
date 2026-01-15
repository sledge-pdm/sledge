import { RGBA, Vec2 } from '@sledge-pdm/core';
import { Layer } from '@sledge-pdm/frasco';
import { LayerHistoryAction, projectHistoryController } from '~/features/history';
import { getLayer, layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo } from '~/features/log';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf } from '~/features/tools/ToolController';
import { FillPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { interactStore } from '~/stores/EditorStores';
import { fill_mask_area, scanline_flood_fill, scanline_flood_fill_with_mask } from '~/utils/wasm';

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
  onStart({ position, color, presetName, layerId }: ToolArgs): ToolResult {
    if (!interactStore.isPointerOnCanvas) {
      return {
        shouldUpdate: false,
      };
    }
    const startTime = Date.now();

    const preset = presetName ? (getPresetOf('fill', presetName) as FillPresetConfig) : undefined;
    if (!preset)
      return {
        shouldUpdate: false,
      };
    const threshold = preset.threshold ?? 0;
    // const limitMode = getSelectionLimitMode();
    const layer = getLayer(layerId);

    const selectionFillMode = preset.selectionFillMode ?? 'inside';
    if (!isSelectionAvailable() || selectionFillMode === 'ignore') {
      fill({
        layerId,
        layer,
        startX: position.x,
        startY: position.y,
        color,
        threshold,
      });
    } else {
      const selectionMask = selectionManager.getSelectionMask();
      if (selectionFillMode === 'inside') {
        //inside
        fill({
          layerId,
          layer,
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
        fillArea({
          layerId,
          layer,
          mask: selectionMask.getMask(),
          color,
        });
      }
    }

    const endTime = Date.now();

    logUserInfo(`Flood Fill done. (in ${endTime - startTime} ms)`);

    return {
      shouldUpdate: true,
    };
  }

  onMove(args: ToolArgs): ToolResult {
    return {
      shouldUpdate: false,
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    return {
      shouldUpdate: false,
    };
  }
}

function fill(args: {
  layerId: string;
  layer: Layer;
  startX: number;
  startY: number;
  color: RGBA;
  threshold: number;
  mask?: {
    buffer: Uint8Array;
    mode: 'inside' | 'outside' | 'none';
  };
}) {
  const { layerId, layer, startX, startY, color, threshold, mask } = args;
  const buf = layer.readPixels({ flipY: true });
  const width = layer.getWidth();
  const height = layer.getHeight();
  let result = false;
  if (mask) {
    result = scanline_flood_fill_with_mask(buf, width, height, startX, startY, ...color, threshold ?? 0, mask.buffer, mask.mode);
  } else {
    result = scanline_flood_fill(buf, width, height, startX, startY, ...color, threshold ?? 0);
  }

  if (result) {
    layer.commitHistory();
    layerManager.replaceLayerBuffer(layerId, buf, width, height, { inputSpace: 'canvas' });
    projectHistoryController.addAction(
      new LayerHistoryAction({
        layerId: layerId,
        context: { tool: TOOL_CATEGORIES.FILL },
      })
    );
  }
}

function fillArea(args: { layerId: string; layer: Layer; color: RGBA; mask: Uint8Array }) {
  const { layerId, layer, color, mask } = args;
  const buf = layer.readPixels({ flipY: true });
  const width = layer.getWidth();
  const height = layer.getHeight();
  const result = fill_mask_area(buf, mask, ...color);

  if (result) {
    layer.commitHistory();
    layerManager.replaceLayerBuffer(layerId, buf, width, height, { inputSpace: 'canvas' });
    projectHistoryController.addAction(
      new LayerHistoryAction({
        layerId: layerId,
        context: { tool: TOOL_CATEGORIES.FILL },
      })
    );
  }
}

