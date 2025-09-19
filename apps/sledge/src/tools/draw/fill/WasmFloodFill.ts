import { Vec2 } from '@sledge/core';
import { scanline_flood_fill, scanline_flood_fill_with_mask } from '@sledge/wasm';
import { colorMatch } from '~/features/color';
// LayerImageAgent 依存除去: AnvilController 経由で操作
import {
  getBufferCopy,
  getBufferPointer,
  getHeight as getLayerHeight,
  getWidth as getLayerWidth,
  registerWholeChange,
} from '~/features/layer/anvil/AnvilController';
import { Fill, FillProps } from './FillTool';

export interface WasmMaskFillProps {
  layerId: string;
  color: [number, number, number, number];
  position: Vec2;
  selectionMask: Uint8Array;
  limitMode: 'inside' | 'outside';
  threshold?: number;
}

/**
 * WASM実装のスキャンライン方式FloodFill
 *
 * 特徴：
 * - 確実で高速なスキャンライン方式
 * - タイルベースの複雑さを排除
 * - メモリ効率的
 * - 選択範囲制限サポート
 */
export class WasmFloodFill implements Fill {
  fill({ layerId, color, position, threshold }: FillProps) {
    const buffer = getBufferPointer(layerId);
    if (!buffer) return false;
    const width = getLayerWidth(layerId)!;
    const height = getLayerHeight(layerId)!;

    const idx = (position.y * width + position.x) * 4;
    if (idx < 0 || idx + 3 >= buffer.length) return false;
    const targetColor: [number, number, number, number] = [buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]];
    if (colorMatch(targetColor, color)) return false;

    const originalBuffer = buffer.slice();
    const startTime = performance.now();

    // WASM FloodFill実行
    const success = scanline_flood_fill(
      new Uint8Array(buffer.buffer),
      width,
      height,
      position.x,
      position.y,
      color[0],
      color[1],
      color[2],
      color[3],
      threshold ?? 0
    );

    registerWholeChange(layerId, originalBuffer, buffer.slice());
    const endTime = performance.now();
    console.log(`WASM FloodFill completed in ${(endTime - startTime).toFixed(2)}ms`);

    if (!success) {
      console.log('WASM FloodFill failed or no changes made');
      return false;
    }

    // 結果をメインバッファに反映
    // pbm.buffer.set(workingBuffer);

    return true;
  }

  fillWithMask({ layerId, color, position, selectionMask, limitMode, threshold }: WasmMaskFillProps) {
    const buffer = getBufferCopy(layerId);
    if (!buffer) return false;
    const width = getLayerWidth(layerId)!;
    const height = getLayerHeight(layerId)!;

    const idx = (position.y * width + position.x) * 4;
    if (idx < 0 || idx + 3 >= buffer.length) return false;
    const targetColor: [number, number, number, number] = [buffer[idx], buffer[idx + 1], buffer[idx + 2], buffer[idx + 3]];
    if (colorMatch(targetColor, color)) return false;

    const originalBuffer = buffer.slice();
    const startTime = performance.now();

    // WASM 選択範囲制限付きFloodFill実行
    const success = scanline_flood_fill_with_mask(
      new Uint8Array(buffer.buffer),
      width,
      height,
      position.x,
      position.y,
      color[0],
      color[1],
      color[2],
      color[3],
      threshold ?? 0,
      selectionMask,
      limitMode
    );

    registerWholeChange(layerId, originalBuffer, buffer.slice());
    const endTime = performance.now();
    console.log(`WASM FloodFill with mask (${limitMode}) completed in ${(endTime - startTime).toFixed(2)}ms`);

    if (!success) {
      console.log('WASM FloodFill with mask failed or no changes made');
      return false;
    }

    return true;
  }
}
