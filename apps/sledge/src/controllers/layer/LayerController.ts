import { mergeLayer } from '~/appliers/LayerMergeApplier';
import { Layer } from '~/models/layer/Layer';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore, layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { RGBAColor, RGBAToHex } from '~/utils/ColorUtils';
import { eventBus } from '~/utils/EventBus';
import LayerImageAgent from './image/LayerImageAgent';
import { getActiveAgent, getAgentOf, getBufferOf, layerAgentManager } from './LayerAgentManager';
import { addLayer, findLayerById, getLayerIndex } from './LayerListController';

const propNamesToUpdate: (keyof Layer)[] = ['mode', 'opacity', 'enabled', 'type', 'dotMagnification'];

export function setLayerName(layerId: string, newName: string): boolean {
  if (!newName || newName.trim() === '') {
    console.warn('Layer name cannot be empty');
    return false;
  }

  const layer = findLayerById(layerId);
  if (!layer) return false;

  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, 'name', newName);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${layerId}) name updated` });
  return true;
}

export function setLayerProp<K extends keyof Layer>(layerId: string, propName: K, newValue: Layer[K]) {
  if (propName === 'id') {
    return;
  }
  const layer = findLayerById(layerId);
  if (!layer) return;

  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, propName, newValue);
  if (propNamesToUpdate.indexOf(propName) !== -1)
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${layerId}) prop updated(${propName})` });
}

export function duplicateLayer(layerId: string) {
  const layer = findLayerById(layerId);
  addLayer(
    {
      ...layer,
    },
    getBufferOf(layerId)
  );
  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) duplicated` });
}

export function clearLayer(layerId: string) {
  const agent = getAgentOf(layerId);
  if (!agent) return;
  const originalBuffer = agent.getBuffer().buffer;
  // clear current buffer
  let width = canvasStore.canvas.width;
  let height = canvasStore.canvas.height;
  const newBuffer = new Uint8ClampedArray(width * height * 4);

  agent.setBuffer(newBuffer, true, true);

  agent.getDiffManager().add({
    kind: 'whole',
    before: new Uint8ClampedArray(originalBuffer),
    after: new Uint8ClampedArray(newBuffer.buffer),
  });
  agent.registerToHistory();
  agent.forceUpdate();
}

export function resetLayerImage(layerId: string, dotMagnification: number, initImage?: Uint8ClampedArray): LayerImageAgent {
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
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) image reset` });
    eventBus.emit('preview:requestUpdate', { layerId: layerId });
    agent.setBuffer(buffer, false, true);
    return agent;
  } else {
    const newAgent = layerAgentManager.registerAgent(layerId, buffer, width, height);
    newAgent.getTileManager().setAllDirty();
    eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) image reset` });
    eventBus.emit('preview:requestUpdate', { layerId: layerId });
    return newAgent;
  }
}

export async function mergeToBelowLayer(layerId: string) {
  const originLayerIndex = getLayerIndex(layerId);
  const targetLayerIndex = originLayerIndex + 1;
  if (originLayerIndex >= layerListStore.layers.length) return;

  const originLayer = layerListStore.layers[originLayerIndex];
  const targetLayer = layerListStore.layers[targetLayerIndex];

  // merge
  await mergeLayer({ originLayer, targetLayer });

  setLayerProp(layerId, 'enabled', false);
  // removeLayer(layerId);
}

export function getCurrentPointingColor(): RGBAColor | undefined {
  const agent = getActiveAgent();
  return agent?.getPixelBufferManager().getPixel({
    x: Math.floor(interactStore.lastMouseOnCanvas.x),
    y: Math.floor(interactStore.lastMouseOnCanvas.y),
  });
}

export function getCurrentPointingColorHex(): string | undefined {
  if (!interactStore.lastMouseOnCanvas) return undefined;
  const agent = getActiveAgent();
  const color = agent?.getPixelBufferManager().getPixel({
    x: Math.floor(interactStore.lastMouseOnCanvas.x),
    y: Math.floor(interactStore.lastMouseOnCanvas.y),
  });
  if (color !== undefined) return `#${RGBAToHex(color, false)}`;

  return undefined;
}

export const canUndo = (): boolean => getActiveAgent()?.canUndo() ?? false;
export const canRedo = (): boolean => getActiveAgent()?.canRedo() ?? false;
