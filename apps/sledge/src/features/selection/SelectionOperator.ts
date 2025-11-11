import { Vec2 } from '@sledge/core';
import { combine_masks_subtract, trim_mask_with_box } from '@sledge/wasm';
import { PackedDiffs } from 'node_modules/@sledge/anvil/src/types/patch/Patch';
import { AnvilLayerHistoryAction, projectHistoryController } from '~/features/history';
import { ConvertSelectionHistoryAction } from '~/features/history/actions/ConvertSelectionHistoryAction';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '~/features/image_pool';
import { activeLayer } from '~/features/layer';
// import { getActiveAgent } from '~/features/layer/agent/LayerAgentManager'; // legacy (will be removed)
import type { RawPixelData } from '@sledge/anvil';
import { getBufferPointer, getHeight as getLayerHeight, getWidth as getLayerWidth } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { FloatingBuffer, floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { getCurrentSelection, selectionManager } from '~/features/selection/SelectionAreaManager';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { SelectionLimitMode } from '~/stores/editor/ToolStore';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { imagePoolStore, layerListStore } from '~/stores/ProjectStores';
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

export function isPositionWithinSelection(pos: Vec2) {
  pos.x = Math.floor(pos.x);
  pos.y = Math.floor(pos.y);

  return selectionManager.isMaskOverlap(pos, true);
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

export function deleteSelectedArea(props?: { layerId?: string; noAction?: boolean }): undefined | PackedDiffs {
  const selection = getCurrentSelection();
  const lid = props?.layerId ?? activeLayer().id;
  const anvil = getAnvilOf(lid);
  if (!anvil) return;

  const bBox = selection.getBoundBox();
  if (!bBox) return;
  const selectionBoundBox = {
    x: bBox.left,
    y: bBox.top,
    width: bBox.right - bBox.left + 1,
    height: bBox.bottom - bBox.top + 1,
  };

  anvil.addPartialDiff(selectionBoundBox, anvil.getPartialBuffer(selectionBoundBox));

  const canvasWidth = anvil.getWidth();

  const buffer = anvil.getBufferPointer();
  for (let oy = 0; oy < selectionBoundBox.height; oy++) {
    for (let ox = 0; ox < selectionBoundBox.width; ox++) {
      const x = selectionBoundBox.x + ox;
      const y = selectionBoundBox.y + oy;
      const maskIdx = y * canvasWidth + x;
      if (selection.getMask()[maskIdx] === 1) {
        const canvasIdx = maskIdx * 4;
        buffer[canvasIdx] = 0;
        buffer[canvasIdx + 1] = 0;
        buffer[canvasIdx + 2] = 0;
        buffer[canvasIdx + 3] = 0;
      }
    }
  }

  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'delete selected area' });
  eventBus.emit('preview:requestUpdate', { layerId: lid });

  const diffs = anvil.flushDiffs();
  if (!props?.noAction) {
    if (diffs) {
      const acc = new AnvilLayerHistoryAction({ layerId: lid, patch: diffs, context: { tool: TOOL_CATEGORIES.RECT_SELECTION } });
      projectHistoryController.addAction(acc);
    }
  }
  return diffs ?? undefined;
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
      buffer: RawPixelData;
      bbox: { x: number; y: number; width: number; height: number };
    }
  | undefined {
  const activeAnvil = getAnvilOf(activeLayer().id);
  if (!activeAnvil) return;
  const width = activeAnvil.getWidth();
  const height = activeAnvil.getHeight();
  selectionManager.commitOffset();
  const mask = selectionManager.getCombinedMask();
  const bbox = computeMaskBBox(mask, width, height);
  if (!bbox) return;

  const trimmedMask = trim_mask_with_box(mask, width, height, bbox.x, bbox.y, bbox.width, bbox.height);
  const selectionBuffer = activeAnvil.sliceWithMask(trimmedMask, bbox.width, bbox.height, bbox.x, bbox.y);

  return {
    buffer: selectionBuffer,
    bbox,
  };
}

export async function convertSelectionToImage(deleteAfter?: boolean) {
  const selectionData = getCurrentSelectionBuffer();
  if (!selectionData) return;
  const { buffer, bbox } = selectionData;

  const oldEntries = imagePoolStore.entries.slice();

  const entry = await createEntryFromRawBuffer(buffer, bbox.width, bbox.height);
  entry.descriptionName = '[ from selection ]';
  entry.transform.x = bbox.x;
  entry.transform.y = bbox.y;
  entry.transform.scaleX = 1;
  entry.transform.scaleY = 1;

  insertEntry(entry, true);
  selectEntry(entry.id);

  const newEntries = imagePoolStore.entries.slice();

  let diffs: PackedDiffs | undefined = undefined;
  if (deleteAfter) {
    diffs = deleteSelectedArea({ noAction: true }) ?? undefined;
  }
  cancelSelection();

  const action = new ConvertSelectionHistoryAction({
    layerId: layerListStore.activeLayerId,
    oldEntries,
    newEntries,
    patch: diffs,
  });
  projectHistoryController.addAction(action);

  selectionManager.setState(isSelectionAvailable() ? 'selected' : 'idle');

  eventBus.emit('selection:updateSelectionMenu', { immediate: true });
  eventBus.emit('selection:updateSelectionPath', { immediate: true });

  if (deleteAfter) {
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'delete selected area' });
    eventBus.emit('preview:requestUpdate', { layerId: layerListStore.activeLayerId });
  }
}
