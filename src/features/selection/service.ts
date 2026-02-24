import { Vec2 } from '@sledge-pdm/core';
import { activeLayer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { toolStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { trim_mask_with_box } from '~/utils/wasm';
import { updateFrascoCanvas } from '~/webgl/service';
import { extractMaskedPatch } from './maskOps';

// SelectionOperator is an integrated manager of selection area and floating move management.

/**
 * 描画制限モードに基づいて描画可能な位置かチェック
 * @param pos チェックする位置
 * @returns 描画可能な場合true、制限により描画不可の場合false
 */
export function isDrawingAllowed(pos: Vec2, checkState?: boolean): boolean {
  const limitMode = toolStore.selectionLimitMode;
  if (checkState) {
    if (limitMode === 'none') {
      // 制限なし：常に描画可能
      return true;
    }
    if (!selectionManager.hasSelection()) {
      // 選択範囲がない場合：制限なしとして扱う
      return true;
    }
  }
  const isInSelection = isPositionWithinSelection(pos);
  if (limitMode === 'inside') {
    // 選択範囲内のみ描画可能
    return isInSelection;
  } else if (limitMode === 'outside') {
    // 選択範囲外のみ描画可能
    return !isInSelection;
  }

  return true;
}

export function isPositionWithinSelection(pos: Vec2): boolean {
  const selection = selectionManager.getSelection();
  const offset = selectionManager.getOffset();
  if (!selection) return false;
  return (
    selection.get({
      x: Math.floor(pos.x - offset.x),
      y: Math.floor(pos.y - offset.y),
    }) !== 0
  );
}

export function cancelSelection() {
  const wasMoving = floatingMoveManager.isMoving();
  const hadSelection = selectionManager.hasSelection();
  if (wasMoving) {
    floatingMoveManager.cancel();
  }
  selectionManager.clearAll();

  updateFrascoCanvas('selection cancelled');

  if (wasMoving || hadSelection) {
    logUserInfo('Selection cancelled.');
  }
}

export function commitMove() {
  const wasMoving = floatingMoveManager.isMoving();
  floatingMoveManager.commit();
  if (wasMoving) {
    logUserInfo('Selection move committed.');
  }
}

export function cancelMove() {
  const wasMoving = floatingMoveManager.isMoving();
  floatingMoveManager.cancel();

  updateFrascoCanvas('move cancelled');

  if (wasMoving) {
    logUserInfo('Selection move cancelled.');
  }
}
// Compute tight bounding box of 1s in a canvas-sized selection mask
export const computeMaskBBox = (
  mask: Uint8Array,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | undefined => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x] === 1) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return undefined;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

export function getCurrentSelectionBuffer():
  | {
      buffer: Uint8ClampedArray;
      bbox: { x: number; y: number; width: number; height: number };
    }
  | undefined {
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;
  selectionManager.commitOffset();
  const mask = selectionManager.getSelection()?.getMask();
  if (!mask) return;
  const bbox = computeMaskBBox(mask, width, height);
  if (!bbox) return;

  const trimmedMask = trim_mask_with_box(mask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);
  const sourceBuffer = layerManager.exportRawCanvas(activeLayer().id);
  const selectionBuffer = extractMaskedPatch(sourceBuffer, trimmedMask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);

  return {
    buffer: selectionBuffer,
    bbox,
  };
}
