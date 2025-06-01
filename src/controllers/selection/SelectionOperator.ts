import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { activeLayer } from '~/controllers/layer/LayerListController';
import { getCurrentSelection, selectionManager } from '~/controllers/selection/SelectionManager';
import { transparent } from '~/utils/ColorUtils';

export function cancelSelection() {
  selectionManager.clear();
}

export function deletePixelInSelection(layerId?: string): boolean {
  const selection = getCurrentSelection();
  const agent = getAgentOf(layerId ?? activeLayer().id);
  if (!agent) return false;

  let box = selectionManager.getBoundBox();
  if (!box) return false;

  const dm = agent.getDiffManager();
  for (let x = box.left; x < box.right; x++) {
    for (let y = box.top; y < box.bottom; y++) {
      if (selection.get({ x, y }) === 1) {
        const diff = agent?.setPixel({ x, y }, transparent, true);
        if (diff !== undefined) dm.add(diff);
      }
    }
  }

  agent.registerToHistory();

  return true;
}
