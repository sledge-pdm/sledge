import LayerImageAgent from '~/models/layer_image/LayerImageAgent';
import { layerAgentManager } from '~/routes/editor';
import { canvasStore, layerHistoryStore, layerListStore, setLayerHistoryStore } from '~/stores/ProjectStores';

const magnificationList: number[] = [1, 2, 4];

export const getNextMagnification = (dotMagnification: number) => {
  const index = magnificationList.findIndex((m) => m === dotMagnification);
  if (index != -1) {
    // 循環
    const nextIndex = index !== magnificationList.length - 1 ? index + 1 : 0;
    return magnificationList[nextIndex];
  } else return 1;
};

export function resetLayerImage(layerId: string, dotMagnification: number): LayerImageAgent {
  const blank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification)
  );
  setLayerHistoryStore(layerId, {
    undoStack: [],
    redoStack: [],
  });
  const agent = layerAgentManager.getAgent(layerId);
  if (agent !== undefined) {
    agent.setImage(blank, false);
    return agent;
  } else {
    return layerAgentManager.registerAgent(layerId, blank);
  }
}

export const canUndo = (): boolean => layerHistoryStore[layerListStore.activeLayerId]?.undoStack.length > 0;
export const canRedo = (): boolean => layerHistoryStore[layerListStore.activeLayerId]?.redoStack.length > 0;
