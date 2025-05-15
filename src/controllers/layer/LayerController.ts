import { layerAgentManager } from '~/controllers/layer/LayerAgentManager';
import { Layer } from '~/models/layer/Layer';
import { canvasStore, layerHistoryStore, layerListStore, setLayerHistoryStore, setLayerListStore } from '~/stores/ProjectStores';
import LayerImageAgent from './image/LayerImageAgent';
import { findLayerById } from './LayerListController';

export function setLayerProp<K extends keyof Layer>(layerId: string, propName: K, newValue: Layer[K]) {
  if (propName === 'id') {
    console.warn("you can't change layer id.");
    return;
  }
  const layer = findLayerById(layerId);
  if (!layer) return;

  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, propName, newValue);
}

export function getActiveLayerIndex(): number {
  return getLayerIndex(layerListStore.activeLayerId);
}

export function getLayerIndex(layerId: string) {
  return layerListStore.layers.findIndex((l) => l.id === layerId);
}

export function resetLayerImage(layerId: string, dotMagnification: number, width?: number, height?: number): LayerImageAgent {
  setLayerHistoryStore(layerId, {
    canUndo: false,
    canRedo: false,
  });
  width = width ?? Math.round(canvasStore.canvas.width / dotMagnification);
  height = height ?? Math.round(canvasStore.canvas.height / dotMagnification);

  // 透明（RGBA＝0,0,0,0）で初期化された Uint8ClampedArray を生成
  const blankBuffer = new Uint8ClampedArray(width * height * 4);

  const agent = layerAgentManager.getAgent(layerId);
  if (agent !== undefined) {
    agent.getTileManager().setAllDirty();
    agent.setBuffer(blankBuffer, false);
    return agent;
  } else {
    return layerAgentManager.registerAgent(layerId, blankBuffer, width, height);
  }
}

export const canUndo = (): boolean => layerHistoryStore[layerListStore.activeLayerId]?.canUndo;
export const canRedo = (): boolean => layerHistoryStore[layerListStore.activeLayerId]?.canRedo;
