import { Layer } from '~/models/layer/Layer';
import { canvasStore, layerHistoryStore, layerListStore, setLayerHistoryStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import LayerImageAgent from './image/LayerImageAgent';
import { getAgentOf, getBufferOf, layerAgentManager } from './LayerAgentManager';
import { addLayer, findLayerById, getLayerIndex } from './LayerListController';

const propNamesToUpdate: (keyof Layer)[] = ['mode', 'opacity', 'enabled', 'type', 'dsl', 'dotMagnification'];

export function setLayerProp<K extends keyof Layer>(layerId: string, propName: K, newValue: Layer[K]) {
  if (propName === 'id') {
    return;
  }
  const layer = findLayerById(layerId);
  if (!layer) return;

  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, propName, newValue);
  if (propNamesToUpdate.indexOf(propName) !== -1) eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
}

export function duplicateLayer(layerId: string) {
  const layer = findLayerById(layerId);
  addLayer(
    {
      ...layer,
    },
    getBufferOf(layerId)
  );
  eventBus.emit('webgl:requestUpdate', { onlyDirty: true });
}

export function resetLayerImage(layerId: string, dotMagnification: number, initImage?: Uint8ClampedArray): LayerImageAgent {
  setLayerHistoryStore(layerId, {
    canUndo: false,
    canRedo: false,
  });
  let width = Math.round(canvasStore.canvas.width / dotMagnification);
  let height = Math.round(canvasStore.canvas.height / dotMagnification);
  let buffer: Uint8ClampedArray;
  if (initImage) {
    buffer = new Uint8ClampedArray(initImage);
  } else {
    // 透明（RGBA＝0,0,0,0）で初期化された Uint8ClampedArray を生成
    buffer = new Uint8ClampedArray(width * height * 4);
  }

  const agent = getAgentOf(layerId);
  if (agent !== undefined) {
    agent.getTileManager().setAllDirty();
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true });
    eventBus.emit('preview:requestUpdate', { layerId: layerId });
    agent.setBuffer(buffer, false, true);
    return agent;
  } else {
    const newAgent = layerAgentManager.registerAgent(layerId, buffer, width, height);
    newAgent.getTileManager().setAllDirty();
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true });
    eventBus.emit('preview:requestUpdate', { layerId: layerId });
    return newAgent;
  }
}

export const canUndo = (): boolean => layerHistoryStore[layerListStore.activeLayerId].canUndo;
export const canRedo = (): boolean => layerHistoryStore[layerListStore.activeLayerId].canRedo;
