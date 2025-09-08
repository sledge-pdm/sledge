import { Vec2 } from '@sledge/core';
import { apply_mask_offset, combine_masks_subtract, filter_by_selection_mask } from '@sledge/wasm';
import { activeLayer } from '~/features/layer';
import { getActiveAgent, getAgentOf } from '~/features/layer/agent/LayerAgentManager';
import { FloatingBuffer, floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { getCurrentSelection, selectionManager } from '~/features/selection/SelectionAreaManager';
import { SelectionFillMode, SelectionLimitMode, setToolStore, toolStore } from '~/stores/EditorStores';
import { TOOL_CATEGORIES } from '~/tools/Tools';
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

export function getSelectionFillMode(): SelectionFillMode {
  return toolStore.selectionFillMode;
}

// 現在の状況からFloat状態を作成
export function startMove() {
  const activeAgent = getActiveAgent();
  if (!activeAgent) {
    console.error('No active agent found');
    return;
  }

  if (isSelectionAvailable()) {
    floatingMoveManager.startMove(selectionManager.getFloatingBuffer(activeAgent.layerId)!, 'selection', activeAgent.layerId);
  } else {
    selectionManager.selectAll();
    const layerFloatingBuffer: FloatingBuffer = {
      buffer: activeAgent.getBuffer().slice(),
      width: activeAgent.getWidth(),
      height: activeAgent.getHeight(),
      offset: { x: 0, y: 0 },
    };
    floatingMoveManager.startMove(layerFloatingBuffer, 'layer', activeAgent.layerId);
  }
}

export function startMoveFromPasted(imageData: ImageData, boundBox: { x: number; y: number; width: number; height: number }) {
  const activeAgent = getActiveAgent();
  if (!activeAgent) {
    console.error('No active agent found');
    return;
  }

  cancelSelection();

  setToolStore('activeToolCategory', TOOL_CATEGORIES.MOVE);

  const pastingOffset = { x: 0, y: 0 };
  // create selection according to pasted image
  selectionManager.beginPreview('replace');
  selectionManager.setPreviewFragment({
    kind: 'rect',
    startPosition: pastingOffset,
    width: boundBox.width,
    height: boundBox.height,
  });
  selectionManager.commit();

  floatingMoveManager.startMove(
    {
      buffer: new Uint8ClampedArray(imageData.data),
      width: boundBox.width,
      height: boundBox.height,
      offset: pastingOffset,
    },
    'pasted',
    activeAgent.layerId
  );
}

export function getSelectionOffset() {
  return floatingMoveManager.isMoving() ? floatingMoveManager.getFloatingBuffer()!.offset : selectionManager.getAreaOffset();
}

export function cancelSelection() {
  if (floatingMoveManager.isMoving()) {
    floatingMoveManager.cancel();
  }
  selectionManager.clear();
}

export function commitMove() {
  floatingMoveManager.commit();
}

export function cancelMove() {
  floatingMoveManager.cancel();
}

export function deletePixelInSelection(layerId?: string): boolean {
  const selection = getCurrentSelection();
  const agent = getAgentOf(layerId ?? activeLayer().id);
  if (!agent) return false;

  const bufferManager = agent.getPixelBufferManager();
  const width = agent.getWidth();
  const height = agent.getHeight();

  // 元バッファを保持
  const before = bufferManager.buffer.slice();

  // moveOffset を考慮した選択マスクを用意
  const baseMask = selection.getMask();
  const { x: offX, y: offY } = selectionManager.getAreaOffset();
  const mask = offX === 0 && offY === 0 ? baseMask : new Uint8Array(apply_mask_offset(baseMask, width, height, offX, offY));

  // マスク内を透明化（"outside" はマスク=1の箇所を透明化する挙動）
  const after = new Uint8ClampedArray(filter_by_selection_mask(new Uint8Array(before), mask, 'outside', width, height));

  // 差分を履歴登録（whole）
  const dm = agent.getDiffManager();
  dm.setWhole(before, after.slice());

  // バッファを反映
  bufferManager.buffer.set(after);

  agent.registerToHistory({ tool: 'clear' });
  // タイルを更新対象に
  agent.getTileManager().setAllDirty();
  agent.forceUpdate();

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
  eventBus.emit('selection:maskChanged', { commit: true });
}
