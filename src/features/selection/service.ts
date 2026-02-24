import { Vec2 } from '@sledge-pdm/core';
import { activeLayer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserInfo } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import { toolStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { updateFrascoCanvas } from '~/webgl/service';
import { computeMaskBBox, extractSelectionBufferFromMask } from './selectionBuffer';

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

  const sourceBuffer = layerManager.exportRawCanvas(activeLayer().id);
  return extractSelectionBufferFromMask(sourceBuffer, mask, width, height);
}

export { convertSelectionToImage, deleteSelectedArea, invertSelectionArea } from './actions';
export { computeMaskBBox };
