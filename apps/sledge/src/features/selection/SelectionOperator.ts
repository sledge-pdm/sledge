import { Vec2 } from '@sledge/core';
import { combine_masks_subtract } from '@sledge/wasm';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { activeLayer } from '~/features/layer';
// import { getActiveAgent } from '~/features/layer/agent/LayerAgentManager'; // legacy (will be removed)
import { getBufferPointer, getHeight as getLayerHeight, getWidth as getLayerWidth } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { FloatingBuffer, floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { getCurrentSelection, selectionManager } from '~/features/selection/SelectionAreaManager';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { SelectionLimitMode } from '~/stores/editor/ToolStore';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';

// SelectionOperator is an integrated manager of selection area and floating move management.

export function isSelectionAvailable(): boolean {
  return selectionManager.isSelected();
}

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
    if (!isSelectionAvailable()) {
      // 選択範囲がない場合：制限なしとして扱う
      return true;
    }
  }

  const isInSelection = selectionManager.isMaskOverlap(pos, true);

  if (limitMode === 'inside') {
    // 選択範囲内のみ描画可能
    return isInSelection;
  } else if (limitMode === 'outside') {
    // 選択範囲外のみ描画可能
    return !isInSelection;
  }

  return true;
}

export function getSelectionLimitMode(): SelectionLimitMode {
  return toolStore.selectionLimitMode;
}

// 現在の状況からFloat状態を作成
export function startMove() {
  const layer = activeLayer();
  const layerId = layer.id;
  const width = getLayerWidth(layerId);
  const height = getLayerHeight(layerId);
  if (width == null || height == null) return;

  if (isSelectionAvailable()) {
    floatingMoveManager.startMove(selectionManager.getFloatingBuffer(layerId)!, 'selection', layerId);
  } else {
    selectionManager.selectAll();
    const buf = getBufferPointer(layerId);
    const layerFloatingBuffer: FloatingBuffer = {
      buffer: buf ? buf.slice() : new Uint8ClampedArray(width * height * 4),
      width,
      height,
      offset: { x: 0, y: 0 },
    };
    floatingMoveManager.startMove(layerFloatingBuffer, 'layer', layerId);
  }
}

export function startMoveFromPasted(imageData: ImageData, boundBox: { x: number; y: number; width: number; height: number }) {
  const layerId = activeLayer().id;
  cancelSelection();
  setToolStore('activeToolCategory', TOOL_CATEGORIES.MOVE);
  const pastingOffset = { x: 0, y: 0 };
  selectionManager.beginPreview('replace');
  selectionManager.setPreviewFragment({ kind: 'rect', startPosition: pastingOffset, width: boundBox.width, height: boundBox.height });
  selectionManager.commit();
  floatingMoveManager.startMove(
    { buffer: new Uint8ClampedArray(imageData.data), width: boundBox.width, height: boundBox.height, offset: pastingOffset },
    'pasted',
    layerId
  );
}

export function getSelectionOffset() {
  return floatingMoveManager.isMoving() ? floatingMoveManager.getFloatingBuffer()!.offset : selectionManager.getAreaOffset();
}

export function cancelSelection() {
  const layerId = floatingMoveManager.getTargetLayerId() ?? undefined;
  if (floatingMoveManager.isMoving()) {
    floatingMoveManager.cancel();
  }
  selectionManager.clear();

  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'selection cancelled' });
  eventBus.emit('preview:requestUpdate', { layerId });
}

export function commitMove() {
  floatingMoveManager.commit();
}

export function cancelMove() {
  const layerId = floatingMoveManager.getTargetLayerId() ?? undefined;
  floatingMoveManager.cancel();

  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'move cancelled' });
  eventBus.emit('preview:requestUpdate', { layerId });
}

export function deleteSelectedArea(layerId?: string): boolean {
  const selection = getCurrentSelection();
  const lid = layerId ?? activeLayer().id;
  const anvil = getAnvilOf(lid);
  if (!anvil) return false;

  const bBox = selection.getBoundBox();
  if (!bBox) return false;
  const selectionBoundBox = {
    x: bBox.left,
    y: bBox.top,
    width: bBox.right - bBox.left + 1,
    height: bBox.bottom - bBox.top + 1,
  };
  anvil.addWholeDiff(anvil.getImageData());
  const deletedArea = new Uint8ClampedArray(selectionBoundBox.width * selectionBoundBox.height * 4);
  anvil.setPartialBuffer(selectionBoundBox, deletedArea);
  const diffs = anvil.flushDiffs();
  if (diffs) {
    const acc = new AnvilLayerHistoryAction(lid, diffs, { tool: TOOL_CATEGORIES.RECT_SELECTION });
    projectHistoryController.addAction(acc);
  }

  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: 'delete in selection' });
  eventBus.emit('preview:requestUpdate', { layerId: lid });

  return true;
}

export function invertSelectionArea() {
  // 1) 移動中なら見た目どおりに反映してから反転
  selectionManager.commitOffset();

  // 2) プレビュー中の内容は混ぜない（明示的に確定していないため）
  if (selectionManager.getPreviewMask()) {
    selectionManager.cancelPreview();
  }

  const selection = getCurrentSelection();
  const mask = selection.getMask();
  if (!mask || mask.length === 0) return;

  // 3) すべて 1 のマスクから現在のマスクを減算して反転を得る
  //    out = 1 & ~mask == ~mask
  let ones: Uint8Array | null = new Uint8Array(mask.length).fill(1);
  const inverted = new Uint8Array(combine_masks_subtract(ones, mask));

  ones = null;
  selection.setMask(inverted);

  // 4) 状態更新とイベント発火
  selectionManager.setState(isSelectionAvailable() ? 'selected' : 'idle');

  eventBus.emit('selection:updateSelectionMenu', { immediate: true });
  eventBus.emit('selection:updateSelectionPath', { immediate: true });
}
