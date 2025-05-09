import { Layer } from '~/models/layer/Layer';
import { layerAgentManager } from '~/routes/editor';
import {
  canvasStore,
  layerHistoryStore,
  layerListStore,
  setLayerHistoryStore,
  setLayerListStore,
} from '~/stores/ProjectStores';
import { findLayerById } from '../layer_list/LayerListController';
import LayerImageAgent from './LayerImageAgent';

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
