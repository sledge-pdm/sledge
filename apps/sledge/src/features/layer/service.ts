// Layer domain service - Stateful layer operations with external dependencies

import { RGBA, RGBAToHex } from '@sledge/anvil';
import { confirm } from '@tauri-apps/plugin-dialog';
import { adjustZoomToFit } from '~/features/canvas';
import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { LayerListHistoryAction } from '~/features/history/actions/LayerListHistoryAction';
import { LayerListReorderHistoryAction } from '~/features/history/actions/LayerListReorderHistoryAction';
import { LayerPropsHistoryAction } from '~/features/history/actions/LayerPropsHistoryAction';
import { getPackedLayerSnapshot } from '~/features/history/actions/utils';
import { anvilManager, getAnvil } from '~/features/layer/anvil/AnvilManager';
import { logUserError, logUserInfo, logUserWarn } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove, cancelSelection } from '~/features/selection/SelectionOperator';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';
import LayerMergeRenderer from '~/webgl/LayerMergeRenderer';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { changeBaseLayerColor, createLayer } from './model';
import { BaseLayerColorMode, BlendMode, Layer, LayerType } from './types';

const LOG_LABEL = 'LayerService';

// Layer property updates
const propNamesToUpdate: (keyof Layer)[] = ['mode', 'opacity', 'enabled', 'type', 'dotMagnification'];

export function setLayerName(layerId: string, newName: string): boolean {
  if (!newName || newName.trim() === '') {
    logUserWarn('Layer name cannot be empty', { label: LOG_LABEL });
    return false;
  }

  const layer = findLayerById(layerId);
  if (!layer) return false;

  const idx = getLayerIndex(layerId);
  setLayerListStore('layers', idx, 'name', newName);
  updateWebGLCanvas(false, `Layer(${layerId}) name updated`);
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
    const act = new LayerPropsHistoryAction({
      layerId,
      oldLayerProps: before,
      newLayerProps: after,
      context: {
        from: `LayerService.setLayerProp(${String(propName)}: ${String(beforeValue)} > ${String(newValue)})`,
        propName,
        before: String(beforeValue),
        after: String(newValue),
      },
    });
    projectHistoryController.addAction(act);
  }
  if (propNamesToUpdate.indexOf(propName) !== -1) updateWebGLCanvas(false, `Layer(${layerId}) prop updated(${propName})`);
}

export function toggleLayerVisibility(layerIds?: string[]) {
  const targets = getOperationTargetLayerIds(layerIds);
  if (targets.length === 0) return;

  const shouldEnable = !targets.every((id) => findLayerById(id)?.enabled);
  targets.forEach((id) => setLayerProp(id, 'enabled', shouldEnable));
  logUserInfo(`Layer visibility ${shouldEnable ? 'enabled' : 'disabled'} for ${targets.length} layer(s).`, { label: LOG_LABEL });
}

export function duplicateLayer(layerId: string) {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const buffer = getAnvil(layerId).getBufferCopy();
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
  updateWebGLCanvas(true, `Layer(${layerId}) duplicated`);
  logUserInfo(`Layer "${layer.name}" duplicated.`, { label: LOG_LABEL });
}

export function duplicateLayers(layerIds?: string[]) {
  const targets = getOperationTargetLayerIds(layerIds);
  targets.forEach((id) => duplicateLayer(id));
}

export async function mergeToBelowLayer(layerId: string) {
  const originLayerIndex = getLayerIndex(layerId);
  const targetLayerIndex = originLayerIndex + 1;
  if (targetLayerIndex >= layerListStore.layers.length) return;

  const originLayer = layerListStore.layers[originLayerIndex];
  const targetLayer = layerListStore.layers[targetLayerIndex];

  const mergeRenderer = new LayerMergeRenderer(originLayer, targetLayer);
  await mergeRenderer.mergeLayer();
  logUserInfo(`Layer "${originLayer.name}" merged into "${targetLayer.name}".`, { label: LOG_LABEL });
}

export function getCurrentPointingColor(): RGBA | undefined {
  const activeAnvil = getAnvil(layerListStore.activeLayerId);
  const x = Math.floor(interactStore.lastMouseOnCanvas.x);
  const y = Math.floor(interactStore.lastMouseOnCanvas.y);
  if (!interactStore.lastMouseOnCanvas || !activeAnvil.getBufferHandle().isInBounds(x, y)) return undefined;
  return activeAnvil.getPixel(x, y);
}

export function getCurrentPointingColorHex(): string | undefined {
  const c = getCurrentPointingColor();
  return c
    ? RGBAToHex(c, {
        excludeAlpha: false,
        withSharp: true,
      })
    : undefined;
}

// Layer list management
interface AddLayerOptions {
  initImage?: Uint8ClampedArray;
  noDiff?: boolean;
  uniqueName?: boolean;
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
    cutFreeze?: boolean;
  },
  options?: AddLayerOptions
) => {
  const {
    name = 'layer 1',
    type = LayerType.Dot,
    enabled = true,
    dotMagnification = 1,
    opacity = 1,
    mode = BlendMode.normal,
    cutFreeze = false,
  } = layer;
  const uniqueName = options?.uniqueName === undefined ? true : options.uniqueName;
  const newLayer = createLayer(
    {
      name,
      type,
      enabled,
      dotMagnification,
      opacity,
      mode,
      cutFreeze,
    },
    uniqueName
  );

  // Initialize anvil
  const width = canvasStore.canvas.width;
  const height = canvasStore.canvas.height;
  anvilManager.registerAnvil(newLayer.id, options?.initImage ?? new Uint8ClampedArray(width * height * 4), width, height);

  const layers = [...allLayers()];
  layers.splice(index, 0, newLayer as any);

  setLayerListStore('layers', layers);
  setActiveLayerId(newLayer.id);

  updateWebGLCanvas(false, `Layer(${newLayer.id}) added`);
  logUserInfo(`Layer "${newLayer.name}" added.`, { label: LOG_LABEL });

  if (!options?.noDiff) {
    const snapshot = getPackedLayerSnapshot(newLayer.id);
    if (snapshot) {
      const act = new LayerListHistoryAction({
        kind: 'add',
        index,
        packedSnapshot: snapshot,
        context: { from: 'LayerService.addLayerTo' },
      });
      projectHistoryController.addAction(act);
    }
  }

  return newLayer;
};

export function setActiveLayerId(id: string): void {
  const layer = findLayerById(id);
  if (layer) {
    if (!layer.enabled) {
      logUserError('Cannot set inactive layer to active', { label: LOG_LABEL });
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

type LayerOrder = 'asc' | 'desc';

function normalizeLayerIds(layerIds: string[], order: LayerOrder = 'asc') {
  const uniqueIds = Array.from(new Set(layerIds));
  const withIndex = uniqueIds
    .map((id) => ({ id, index: getLayerIndex(id) }))
    .filter((item) => item.index !== -1);

  withIndex.sort((a, b) => (order === 'asc' ? a.index - b.index : b.index - a.index));

  return withIndex.map((item) => item.id);
}

function getOperationTargetLayerIds(layerIds?: string[], options?: { fallbackToActive?: boolean; order?: LayerOrder }) {
  const fallbackToActive = options?.fallbackToActive ?? true;
  const order = options?.order ?? 'asc';

  let targets: string[] = [];
  if (!layerIds || layerIds.length === 0) {
    if (layerListStore.selectionEnabled && layerListStore.selected.size > 0) {
      targets = Array.from(layerListStore.selected);
    }

    if (targets.length === 0 && fallbackToActive && layerListStore.activeLayerId) {
      targets = [layerListStore.activeLayerId];
    }
  } else {
    targets = layerIds;
  }

  return normalizeLayerIds(targets, order);
}

export function summarizeLayerNames(layerIds: string[]) {
  const names = layerIds.map((id) => layerListStore.layers.find((l) => l.id === id)?.name ?? id);
  if (names.length === 0) return '';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')}... (+${names.length - 3})`;
}

function dropFromSelection(layerIds: string[]) {
  if (!layerIds.length) return;
  setLayerListStore('selected', (set: Set<string>) => {
    const updated = new Set(set);
    layerIds.forEach((id) => updated.delete(id));
    return updated;
  });
}

export function setImagePoolActive(active: boolean) {
  setLayerListStore('isImagePoolActive', active);
}

export function isImagePoolActive() {
  return layerListStore.isImagePoolActive;
}

export const resetAllLayers = () => {
  layerListStore.layers.forEach((l) => {
    getAnvil(l.id).resetBuffer();
  });
  updateWebGLCanvas(false, `Reset all layers`);

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
  updateWebGLCanvas(false, `Layer moved from ${fromIndex} to ${targetIndex}`);

  if (!noDiff) {
    const afterOrder = updated.map((l) => l.id);
    const act = new LayerListReorderHistoryAction({ beforeOrder, afterOrder, context: { from: 'LayerService.moveLayer' } });
    projectHistoryController.addAction(act);
  }
};

interface RemoveLayerOptions {
  noDiff?: boolean;
}

export const removeLayersFromUser = async (layerIds?: string[], options?: RemoveLayerOptions) => {
  const targets = getOperationTargetLayerIds(layerIds, { order: 'desc' });
  if (targets.length === 0) {
    logUserWarn('No layer selected for removal.', { label: LOG_LABEL });
    return;
  }

  if (layerListStore.layers.length - targets.length < 1) {
    logUserWarn('Cannot remove all layers. At least one layer must remain.', { label: LOG_LABEL });
    return;
  }

  if (globalConfig.editor.requireConfirmBeforeLayerRemove) {
    const message =
      targets.length === 1
        ? `Sure to remove layer "${summarizeLayerNames(targets)}"?`
        : `Sure to remove ${targets.length} layers? (${summarizeLayerNames(targets)})`;
    const removeConfirmed = await confirm(message, {
      title: 'Remove Layer',
    });
    if (!removeConfirmed) return;
  }

  targets.forEach((id) => removeLayer(id, options));
  dropFromSelection(targets);
};

export const removeLayerFromUser = async (layerId: string, options?: RemoveLayerOptions) => {
  await removeLayersFromUser([layerId], options);
};

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
  const anvil = getAnvil(toRemove.id);
  const snapshot = getPackedLayerSnapshot(toRemove.id);
  layers.splice(index, 1);

  setLayerListStore('layers', layers);
  setLayerListStore('activeLayerId', layers[newActiveIndex].id);
  updateWebGLCanvas(false, `Layer(${layerId}) removed`);
  logUserInfo(`Layer "${toRemove.name}" removed.`, { label: LOG_LABEL });

  if (!noDiff && snapshot) {
    const act = new LayerListHistoryAction({
      kind: 'delete',
      index,
      packedSnapshot: snapshot,
      context: { from: 'LayerService.removeLayer' },
    });
    projectHistoryController.addAction(act);
  }

  // Anvil インスタンスも破棄
  anvilManager.removeAnvil(layerId);
};

export const clearLayersFromUser = async (layerIds?: string[]) => {
  const targets = getOperationTargetLayerIds(layerIds);
  if (targets.length === 0) {
    logUserWarn('No layer selected for clear.', { label: LOG_LABEL });
    return;
  }

  if (globalConfig.editor.requireConfirmBeforeLayerClear) {
    const confirmed = await confirm(
      targets.length === 1
        ? `Sure to clear layer "${summarizeLayerNames(targets)}"?`
        : `Sure to clear ${targets.length} layers? (${summarizeLayerNames(targets)})`,
      {
        title: 'Clear Layer',
      }
    );
    if (!confirmed) return;
  }

  targets.forEach((id) => clearLayer(id));
};

export const clearLayerFromUser = async (layerId: string) => {
  await clearLayersFromUser([layerId]);
};

export function clearLayer(layerId: string) {
  const anvil = getAnvil(layerId);
  const w = anvil.getWidth();
  const h = anvil.getHeight();
  if (w == null || h == null) return;

  anvil.addCurrentWholeDiff();

  anvil.getBufferHandle().fill([0, 0, 0, 0]);

  const patch = anvil.flushDiffs();
  if (patch)
    projectHistoryController.addAction(
      new AnvilLayerHistoryAction({
        layerId,
        patch,
        context: { tool: 'clear' },
      })
    );
  updateWebGLCanvas(true, `Layer(${layerId}) cleared`);
  updateLayerPreview(layerId);
  logUserInfo(`Layer "${findLayerById(layerId)?.name ?? layerId}" cleared.`, { label: LOG_LABEL });
}

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
  updateWebGLCanvas(false, `BaseLayer color mode changed to ${colorMode}`);
  setProjectStore('isProjectChangedAfterSave', true);
}

/**
 * ベースレイヤーのカスタムカラーを変更する
 */
export function setBaseLayerCustomColor(customColor: string) {
  const updatedBaseLayer = changeBaseLayerColor(layerListStore.baseLayer, 'custom', customColor);
  setLayerListStore('baseLayer', updatedBaseLayer);
  updateWebGLCanvas(false, `BaseLayer custom color changed to ${customColor}`);
  setProjectStore('isProjectChangedAfterSave', true);
}

export function setSelectionEnabled(enabled: boolean) {
  setLayerListStore('selectionEnabled', enabled);
}
export function isSelectionEnabled() {
  return layerListStore.selectionEnabled;
}

export function selectLayer(layerId: string) {
  if (!findLayerById(layerId)) return;
  setLayerListStore('selected', (set: Set<string>) => {
    const updated = new Set(set);
    updated.add(layerId);
    return updated;
  });
}
export function deselectLayer(layerId: string) {
  setLayerListStore('selected', (set: Set<string>) => {
    const updated = new Set(set);
    updated.delete(layerId);
    return updated;
  });
}
export function getSelectedLayers(noFallbackToActive: boolean = false): string[] {
  return getOperationTargetLayerIds(undefined, { fallbackToActive: !noFallbackToActive });
}
