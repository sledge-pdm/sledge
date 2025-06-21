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

  return true;
}
