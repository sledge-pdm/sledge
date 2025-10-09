// Layer domain service - Stateful layer operations with external dependencies

import { mergeLayer } from '~/appliers/LayerMergeApplier';
import { adjustZoomToFit } from '~/features/canvas';
import { RGBAColor, RGBAToHex } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { LayerListHistoryAction, LayerSnapshot } from '~/features/history/actions/LayerListHistoryAction';
import { LayerPropsHistoryAction } from '~/features/history/actions/LayerPropsHistoryAction';
import { flushPatch, getBufferCopy, getHeight, getPixel, getWidth, registerWholeChange, setBuffer } from '~/features/layer/anvil/AnvilController';
import { anvilManager, getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { setBottomBarText } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove, cancelSelection } from '~/features/selection/SelectionOperator';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore, layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { changeBaseLayerColor, createLayer } from './model';
import { BaseLayerColorMode, BlendMode, Layer, LayerType } from './types';

// Layer property updates
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

interface SetLayerPropOptions {
  noDiff?: boolean;
}

export function setLayerProp<K extends keyof Layer>(layerId: string, propName: K, newValue: Layer[K], options?: SetLayerPropOptions) {
  if (propName === 'id') {
    return;
  }
  const layer = findLayerById(layerId);
  if (!layer) return;
  const beforeValue = layer[propName];
  const before = { ...layer } as any;
  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, propName, newValue as any);
  const after = { ...findLayerById(layerId)! } as any;
  // Remove id from snapshots
  delete before.id;
  delete after.id;
  if (!options?.noDiff) {
    const act = new LayerPropsHistoryAction(layerId, before, after, {
      from: `LayerService.setLayerProp(${String(propName)}: ${String(beforeValue)} > ${String(newValue)})`,
      propName,
      before: String(beforeValue),
      after: String(newValue),
    });
    projectHistoryController.addAction(act);
  }
  if (propNamesToUpdate.indexOf(propName) !== -1)
    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${layerId}) prop updated(${propName})` });
}

export function duplicateLayer(layerId: string) {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const buffer = getBufferCopy(layerId);
  addLayer(
    {
      name: layer.name,
      type: layer.type,
      enabled: layer.enabled,
      dotMagnification: layer.dotMagnification,
      opacity: layer.opacity,
      mode: layer.mode,
    },
    { initImage: buffer }
  );
  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) duplicated` });
}

export function clearLayer(layerId: string) {
  const before = getBufferCopy(layerId);
  const w = getWidth(layerId);
  const h = getHeight(layerId);
  if (!before || w == null || h == null) return;
  const after = new Uint8ClampedArray(w * h * 4);
  setBuffer(layerId, after);
  registerWholeChange(layerId, before);
  const patch = flushPatch(layerId);
  if (patch) projectHistoryController.addAction(new AnvilLayerHistoryAction(layerId, patch, { tool: 'clear' }));
  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) cleared` });
  eventBus.emit('preview:requestUpdate', { layerId });
}

export async function mergeToBelowLayer(layerId: string) {
  const originLayerIndex = getLayerIndex(layerId);
  const targetLayerIndex = originLayerIndex + 1;
  if (originLayerIndex >= layerListStore.layers.length) return;

  const originLayer = layerListStore.layers[originLayerIndex];
  const targetLayer = layerListStore.layers[targetLayerIndex];

  await mergeLayer({ originLayer, targetLayer });

  setLayerProp(layerId, 'enabled', false, { noDiff: true });
  if (layerListStore.activeLayerId === layerId) {
    setLayerListStore('activeLayerId', targetLayer.id);
  }

  // TODO: add Merge history action which provides undo/redo for both layers
}

export function getCurrentPointingColor(): RGBAColor | undefined {
  if (!interactStore.lastMouseOnCanvas) return undefined;
  const x = Math.floor(interactStore.lastMouseOnCanvas.x);
  const y = Math.floor(interactStore.lastMouseOnCanvas.y);
  const color = getPixel(layerListStore.activeLayerId, x, y);
  return color as RGBAColor | undefined;
}

export function getCurrentPointingColorHex(): string | undefined {
  const c = getCurrentPointingColor();
  return c ? `#${RGBAToHex(c, false)}` : undefined;
}

// Layer list management
interface AddLayerOptions {
  initImage?: Uint8ClampedArray;
  noDiff?: boolean;
}

/**
 * Get a unique layer name by appending a number if needed
 */
function getNumberUniqueLayerName(baseName: string): string {
  const existingNames = layerListStore.layers.map((l) => l.name);
  let counter = 1;
  let candidateName = baseName;

  while (existingNames.includes(candidateName)) {
    candidateName = `${baseName} ${counter}`;
    counter++;
  }

  return candidateName;
}

export const addLayer = (
  layer: {
    name?: string;
    type?: LayerType;
    enabled?: boolean;
    dotMagnification?: number;
    opacity?: number;
    mode?: BlendMode;
  },
  options?: AddLayerOptions
) => {
  return addLayerTo(0, layer, options);
};

export const addLayerTo = (
  index: number,
  layer: {
    name?: string;
    type?: LayerType;
    enabled?: boolean;
    dotMagnification?: number;
    opacity?: number;
    mode?: BlendMode;
  },
  options?: AddLayerOptions
) => {
  const { name = 'layer', type = LayerType.Dot, enabled = true, dotMagnification = 1, opacity = 1, mode = BlendMode.normal } = layer;

  const newLayer = createLayer(
    {
      name,
      type,
      enabled,
      dotMagnification,
      opacity,
      mode,
      initImage: options?.initImage,
    },
    getNumberUniqueLayerName
  );

  // Initialize anvil
  const width = canvasStore.canvas.width;
  const height = canvasStore.canvas.height;
  const anvil = anvilManager.registerAnvil(newLayer.id, options?.initImage ?? new Uint8ClampedArray(width * height * 4), width, height);

  const layers = [...allLayers()];
  layers.splice(index, 0, newLayer as any);

  setLayerListStore('layers', layers);
  setActiveLayerId(newLayer.id);

  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer(${newLayer.id}) added` });

  if (!options?.noDiff) {
    const snapshot: LayerSnapshot = { layer: newLayer, image: { buffer: anvil.getImageData(), width: anvil.getWidth(), height: anvil.getHeight() } };

    const act = new LayerListHistoryAction('add', index, snapshot, undefined, undefined, { from: 'LayerService.addLayerTo' });
    projectHistoryController.addAction(act);
  }

  return newLayer;
};

export function setActiveLayerId(id: string): void {
  const layer = findLayerById(id);
  if (layer) {
    if (!layer.enabled) {
      console.warn('Cannot set inactive layer to active');
      setBottomBarText('Cannot set inactive layer to active');
      return;
    }
    if (layerListStore.activeLayerId === id) return;

    // cancel if move is not committed
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      cancelSelection();
    }

    setLayerListStore('activeLayerId', id);
  }
}

export function getActiveLayerIndex(): number {
  return getLayerIndex(layerListStore.activeLayerId);
}

export function getLayerIndex(layerId: string) {
  return layerListStore.layers.findIndex((l) => l.id === layerId);
}

export function setImagePoolActive(active: boolean) {
  setLayerListStore('isImagePoolActive', active);
}

export function isImagePoolActive() {
  return layerListStore.isImagePoolActive;
}

export const resetAllLayers = () => {
  layerListStore.layers.forEach((l) => {
    getAnvilOf(l.id)?.resetBuffer();
  });
  adjustZoomToFit();
};

interface MoveLayerOptions {
  noDiff?: boolean;
}

export const moveLayer = (fromIndex: number, targetIndex: number, options?: MoveLayerOptions) => {
  const { noDiff = false } = options ?? {};

  const beforeOrder = layerListStore.layers.map((l) => l.id);
  const updated = [...layerListStore.layers];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(targetIndex, 0, moved);
  setLayerListStore('layers', updated);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer moved from ${fromIndex} to ${targetIndex}` });

  if (!noDiff) {
    const afterOrder = updated.map((l) => l.id);
    const act = new LayerListHistoryAction('reorder', -1, undefined, beforeOrder, afterOrder, { from: 'LayerService.moveLayer' });
    projectHistoryController.addAction(act);
  }
};

interface RemoveLayerOptions {
  noDiff?: boolean;
}

export const removeLayer = (layerId?: string, options?: RemoveLayerOptions) => {
  const { noDiff = false } = options ?? {};

  if (layerId === undefined) return;
  const layers = [...allLayers()];
  if (layers.length <= 1) return;
  const index = layers.findIndex((l) => l.id === layerId);
  let newActiveIndex = 0;
  if (index !== 0) newActiveIndex = index - 1;

  // snapshot before removal
  const toRemove = layers[index];
  const anvil = getAnvilOf(toRemove.id);
  if (!anvil) return;
  const snapshot: LayerSnapshot = { layer: toRemove, image: { buffer: anvil.getImageData(), width: anvil.getWidth(), height: anvil.getHeight() } };

  layers.splice(index, 1);

  setLayerListStore('layers', layers);
  setLayerListStore('activeLayerId', layers[newActiveIndex].id);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) removed` });

  if (!noDiff) {
    const act = new LayerListHistoryAction('delete', index, snapshot, undefined, undefined, { from: 'LayerService.removeLayer' });
    projectHistoryController.addAction(act);
  }

  // Anvil インスタンスも破棄
  anvilManager.removeAnvil(layerId);
};

export const allLayers = () => layerListStore.layers;
export const findLayerById = (id: string) => allLayers().find((layer) => layer.id === id);
export const activeLayer = () => findLayerById(layerListStore.activeLayerId) || allLayers()[0];
export const activeIndex = () => allLayers().findIndex((layer) => layer.id === layerListStore.activeLayerId);

// BaseLayer operations
/**
 * ベースレイヤーのカラーモードを変更する
 */
export function setBaseLayerColorMode(colorMode: BaseLayerColorMode, customColor?: string) {
  const updatedBaseLayer = changeBaseLayerColor(layerListStore.baseLayer, colorMode, customColor);
  setLayerListStore('baseLayer', updatedBaseLayer);
  eventBus.emit('webgl:requestUpdate', {
    onlyDirty: false,
    context: `BaseLayer color mode changed to ${colorMode}`,
  });
}

/**
 * ベースレイヤーのカスタムカラーを変更する
 */
export function setBaseLayerCustomColor(customColor: string) {
  const updatedBaseLayer = changeBaseLayerColor(layerListStore.baseLayer, 'custom', customColor);
  setLayerListStore('baseLayer', updatedBaseLayer);
  eventBus.emit('webgl:requestUpdate', {
    onlyDirty: false,
    context: `BaseLayer custom color changed to ${customColor}`,
  });
}
