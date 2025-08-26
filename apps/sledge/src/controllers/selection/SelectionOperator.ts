import { combine_masks_subtract } from '@sledge/wasm';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { getCurrentSelection, selectionManager } from '~/controllers/selection/SelectionManager';
import { getToolCategory } from '~/controllers/tool/ToolController';
import { MoveTool } from '~/tools/move/MoveTool';
import { transparent } from '~/utils/ColorUtils';
import { eventBus } from '~/utils/EventBus';

export function commitMove() {
  const moveTool = getToolCategory('move').behavior as MoveTool;
  moveTool.commit();
}

export function cancelMove() {
  const isLayerMove = selectionManager.getState() === 'move_layer';
  const moveTool = getToolCategory('move').behavior as MoveTool;
  moveTool.cancel();

  // レイヤーの場合移動キャンセルで選択解除まで行う
  if (isLayerMove) {
    selectionManager.clear();
  }
}

export function cancelSelection() {
  if (selectionManager.isMoveState()) {
    cancelMove();
  }
  selectionManager.clear();
}

export function deletePixelInSelection(layerId?: string): boolean {
  const selection = getCurrentSelection();
  const agent = getAgentOf(layerId ?? activeLayer().id);
  if (!agent) return false;

  const dm = agent.getDiffManager();
  for (let x = 0; x < selection.getWidth(); x++) {
    for (let y = 0; y < selection.getHeight(); y++) {
      if (selectionManager.isMaskOverlap({ x, y }, true)) {
        const diff = agent?.setPixel({ x, y }, transparent, true);
        if (diff !== undefined) dm.add(diff);
      }
    }
  }

  agent.registerToHistory();
  agent.forceUpdate();

  return true;
}

export function invertSelection() {
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
  const ones = new Uint8Array(mask.length);
  ones.fill(1);
  const inverted = new Uint8Array(combine_masks_subtract(ones, mask));

  selection.setMask(inverted);

  // 4) 状態更新とイベント発火
  selectionManager.setState(selectionManager.isSelected() ? 'selected' : 'idle');
  eventBus.emit('selection:areaChanged', { commit: true });
}
