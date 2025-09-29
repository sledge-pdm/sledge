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
import { getSelectionLimitMode, isDrawingAllowed, isSelectionAvailable } from '~/features/selection/SelectionOperator';
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

    console.log('start');
    // 描画制限チェック
    if (!isDrawingAllowed(position, true)) {
      console.log('aa');
      return {
        shouldUpdate: false,
        shouldRegisterToHistory: false,
      };
    }

    const preset = presetName ? (getPresetOf('fill', presetName) as any) : undefined;
    const threshold = preset?.threshold ?? 0;
    const limitMode = getSelectionLimitMode();

    const before = getBufferCopy(ctx.layerId);

    // 選択範囲がない、または制限モードがnoneの場合は通常のフラッドフィル
    if (!isSelectionAvailable()) {
      console.log('hm');
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
      console.log('woah');
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
        this.fillWithAreaMode(ctx, color, selectionMask.getMask());
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

  private fillWithAreaMode(ctx: AnvilToolContext, color: RGBAColor, selectionMask: Uint8Array): void {
    const layerId = ctx.layerId;
    const width = getLayerWidth(layerId)!;
    const height = getLayerHeight(layerId)!;
    const currentBuffer = getBufferPointer(layerId)!;

    // 元画像を記録
    const sourceBuffer = currentBuffer.slice();

    // 選択範囲全体を指定色で塗りつぶし
    // currentBuffer を直接塗る
    for (let i = 0; i < selectionMask.length; i++) {
      const isInSelection = selectionMask[i] === 1;
      if (isInSelection) {
        const bufferIndex = i * 4;
        currentBuffer[bufferIndex] = color[0]; // R
        currentBuffer[bufferIndex + 1] = color[1]; // G
        currentBuffer[bufferIndex + 2] = color[2]; // B
        currentBuffer[bufferIndex + 3] = color[3]; // A
      }
    }

    // バッファ全体の差分を履歴に記録
    registerWholeChange(layerId, sourceBuffer, currentBuffer.slice());
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
