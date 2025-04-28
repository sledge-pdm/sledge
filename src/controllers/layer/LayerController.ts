import LayerImageAgent from '~/models/layer_image/LayerImageAgent';
import { layerImageManager } from '~/routes/editor';
import { canvasStore } from '~/stores/project/canvasStore';
import { setLayerHistoryStore } from '~/stores/ProjectStores';

const magnificationList: number[] = [1, 2, 4];

export const getNextMagnification = (dotMagnification: number) => {
  const index = magnificationList.findIndex((m) => m === dotMagnification);
  if (index != -1) {
    // 循環
    const nextIndex = index !== magnificationList.length - 1 ? index + 1 : 0;
    return magnificationList[nextIndex];
  } else return 1;
};

export default function resetLayerImage(
  layerId: string,
  dotMagnification: number
): LayerImageAgent {
  const blank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification)
  );
  setLayerHistoryStore(layerId, {
    undoStack: [],
    redoStack: [],
  });
  return layerImageManager.registerAgent(layerId, blank);
}
