import { createEventBus } from '@solid-primitives/event-bus';
import LayerImageAgent from '~/models/layer_image/LayerImageAgent';
import { layerAgentManager } from '~/routes/editor';
import {
  canvasStore,
  layerHistoryStore,
  layerListStore,
  setLayerHistoryStore,
  setLayerListStore,
} from '~/stores/ProjectStores';
import { Layer } from '~/types/Layer';
import { findLayerById } from '../layer_list/LayerListController';
import { debounce } from '@solid-primitives/scheduled';

export function setLayerProp<K extends keyof Layer>(layerId: string, propName: K, newValue: Layer[K]) {
  if (propName === 'id') {
    console.warn("you can't change layer id.");
    return;
  }
  // 1) 現在のレイヤーを取得
  const layer = findLayerById(layerId);
  if (!layer) return;

  // 2) Solid の store セッターを使う場合は直接ここで更新できます
  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, propName, newValue);
}

export function getActiveLayerIndex(): number {
  return getLayerIndex(layerListStore.activeLayerId);
}

export function getLayerIndex(layerId: string) {
  return layerListStore.layers.findIndex((l) => l.id === layerId);
}

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
  setLayerHistoryStore(layerId, {
    undoStack: [],
    redoStack: [],
  });
  const blank = new ImageData(
    Math.round(canvasStore.canvas.width / dotMagnification),
    Math.round(canvasStore.canvas.height / dotMagnification)
  );
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
