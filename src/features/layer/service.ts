// Layer domain service - Stateful layer operations with external dependencies

import { FlipEffect, Rotate90Effect } from '@sledge-pdm/frasco';
import { adjustZoomToFit } from '~/features/canvas';
import { CanvasSizeHistoryAction, projectHistoryController } from '~/features/history';
import { LayerListHistoryAction } from '~/features/history/actions/LayerListHistoryAction';
import { LayerListReorderHistoryAction } from '~/features/history/actions/LayerListReorderHistoryAction';
import { LayerPropsHistoryAction } from '~/features/history/actions/LayerPropsHistoryAction';
import { getPackedLayerSnapshot } from '~/features/history/actions/utils';
import { getLayer, layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserError, logUserInfo, logUserWarn } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove, cancelSelection } from '~/features/selection/SelectionOperator';
import { setIOStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { eventBus } from '~/utils/EventBus';
import { dialog } from '~/utils/platform';
import LayerMergeRenderer from '~/webgl/LayerMergeRenderer';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';
import { changeBaseLayerColor, createLayer } from './model';
import { BaseLayerColorMode, BlendMode, Layer, LayerType } from './types';

const LOG_LABEL = 'LayerService';

// Layer property updates
const propNamesToUpdate: (keyof Layer)[] = ['mode', 'opacity', 'enabled', 'type'];

export function setLayerName(layerId: string, newName: string): boolean {
  if (!newName || newName.trim() === '') {
    logUserWarn('Layer name cannot be empty', { label: LOG_LABEL });
    return false;
  }
  setLayerProp(layerId, 'name', newName);
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
  if (beforeValue === newValue) return;
  const before = { ...layer } as any;
  const idx = getLayerIndex(layerId);
  setProjectStore('layers', 'layers', idx, propName, newValue as any);
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
  if (propNamesToUpdate.indexOf(propName) !== -1) updateWebGLCanvas(`Layer(${layerId}) prop updated(${propName})`);
}

export function toggleLayerVisibility(layerIds?: string[]) {
  const targets = getOperationTargetLayerIds(layerIds);
  if (targets.length === 0) return;

  const shouldEnable = !targets.every((id) => findLayerById(id)?.enabled);
  targets.forEach((id) => setLayerProp(id, 'enabled', shouldEnable));
  logUserInfo(`Layer visibility ${shouldEnable ? 'enabled' : 'disabled'} for ${targets.length} layer(s).`, { label: LOG_LABEL });
  if (targets.length > 0) resetSelectionState();
}

export function duplicateLayer(layerId: string) {
  const layer = findLayerById(layerId);
  if (!layer) return;
  const buffer = layerManager.exportRawCanvas(layerId);
  addLayer(
    {
      name: layer.name,
      type: layer.type,
      enabled: layer.enabled,
      opacity: layer.opacity,
      mode: layer.mode,
    },
    { initImage: buffer }
  );
  updateWebGLCanvas(`Layer(${layerId}) duplicated`);
  logUserInfo(`Layer "${layer.name}" duplicated.`, { label: LOG_LABEL });
}

export function duplicateLayers(layerIds?: string[]) {
  const targets = getOperationTargetLayerIds(layerIds);
  targets.forEach((id) => duplicateLayer(id));
  if (targets.length > 0) resetSelectionState();
}

export async function mergeToBelowLayer(layerId: string) {
  const originLayerIndex = getLayerIndex(layerId);
  const targetLayerIndex = originLayerIndex + 1;
  if (targetLayerIndex >= projectStore.layers.layers.length) return;

  const originLayer = projectStore.layers.layers[originLayerIndex];
  const targetLayer = projectStore.layers.layers[targetLayerIndex];

  const mergeRenderer = new LayerMergeRenderer(originLayer, targetLayer);
  await mergeRenderer.mergeLayer();
  logUserInfo(`Layer "${originLayer.name}" merged into "${targetLayer.name}".`, { label: LOG_LABEL });
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
    opacity?: number;
    mode?: BlendMode;
    cutFreeze?: boolean;
  },
  options?: AddLayerOptions
) => {
  const { name = 'layer 1', type = LayerType.Dot, enabled = true, opacity = 1, mode = BlendMode.normal, cutFreeze = false } = layer;
  const uniqueName = options?.uniqueName === undefined ? true : options.uniqueName;
  const newLayer = createLayer(
    {
      name,
      type,
      enabled,
      opacity,
      mode,
      cutFreeze,
    },
    uniqueName
  );

  // Initialize anvil
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;
  layerManager.registerLayer(newLayer.id, options?.initImage ?? new Uint8ClampedArray(width * height * 4), width, height, {
    inputSpace: 'canvas',
  });

  const layers = [...allLayers()];
  layers.splice(index, 0, newLayer as any);

  setProjectStore('layers', 'layers', layers);
  setActiveLayerId(newLayer.id);

  updateWebGLCanvas(`Layer(${newLayer.id}) added`);
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
    if (projectStore.layers.state.activeLayerId === id) return;

    // cancel if move is not committed
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      cancelSelection();
    }

    setProjectStore('layers', 'state', 'activeLayerId', id);
  }
}

export function getActiveLayerIndex(): number {
  return getLayerIndex(projectStore.layers.state.activeLayerId);
}

export function getLayerIndex(layerId: string) {
  return projectStore.layers.layers.findIndex((l) => l.id === layerId);
}

type LayerOrder = 'asc' | 'desc';

function normalizeLayerIds(layerIds: string[], order: LayerOrder = 'asc') {
  const uniqueIds = Array.from(new Set(layerIds));
  const withIndex = uniqueIds.map((id) => ({ id, index: getLayerIndex(id) })).filter((item) => item.index !== -1);

  withIndex.sort((a, b) => (order === 'asc' ? a.index - b.index : b.index - a.index));

  return withIndex.map((item) => item.id);
}

function getOperationTargetLayerIds(layerIds?: string[], options?: { fallbackToActive?: boolean; order?: LayerOrder }) {
  const fallbackToActive = options?.fallbackToActive ?? true;
  const order = options?.order ?? 'asc';

  let targets: string[] = [];
  if (!layerIds || layerIds.length === 0) {
    if (projectStore.layers.state.selectionEnabled && projectStore.layers.state.selected.size > 0) {
      targets = Array.from(projectStore.layers.state.selected);
    }

    if (targets.length === 0 && fallbackToActive && projectStore.layers.state.activeLayerId) {
      targets = [projectStore.layers.state.activeLayerId];
    }
  } else {
    targets = layerIds;
  }

  return normalizeLayerIds(targets, order);
}

export function summarizeLayerNames(layerIds: string[]) {
  const names = layerIds.map((id) => projectStore.layers.layers.find((l) => l.id === id)?.name ?? id);
  if (names.length === 0) return '';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')}... (+${names.length - 3})`;
}

function dropFromSelection(layerIds: string[]) {
  if (!layerIds.length) return;
  setProjectStore('layers', 'state', 'selected', (set: Set<string>) => {
    const updated = new Set(set);
    layerIds.forEach((id) => updated.delete(id));
    return updated;
  });
}

export function resetSelectionState() {
  setProjectStore('layers', 'state', 'selectionEnabled', false);
  setProjectStore('layers', 'state', 'selected', () => new Set<string>());
}

export const resetAllLayers = () => {
  projectStore.layers.layers.forEach((l) => {
    const layer = layerManager.getLayerOptional(l.id);
    if (layer) {
      layer.clear([0, 0, 0, 0]);
    }
  });
  updateWebGLCanvas(`Reset all layers`);

  adjustZoomToFit();
};

interface MoveLayerOptions {
  noDiff?: boolean;
}

export const moveLayer = (fromIndex: number, targetIndex: number, options?: MoveLayerOptions) => {
  const { noDiff = false } = options ?? {};

  const beforeOrder = projectStore.layers.layers.map((l) => l.id);
  const updated = [...projectStore.layers.layers];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(targetIndex, 0, moved);
  setProjectStore('layers', 'layers', updated);
  updateWebGLCanvas(`Layer moved from ${fromIndex} to ${targetIndex}`);

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

  if (projectStore.layers.layers.length - targets.length < 1) {
    logUserWarn('Cannot remove all layers. At least one layer must remain.', { label: LOG_LABEL });
    return;
  }

  if (globalConfig.editor.requireConfirmBeforeLayerRemove) {
    const message =
      targets.length === 1
        ? `Sure to remove layer "${summarizeLayerNames(targets)}"?`
        : `Sure to remove ${targets.length} layers? (${summarizeLayerNames(targets)})`;
    const removeConfirmed = await dialog.confirm(message, {
      title: 'Remove Layer',
    });
    if (!removeConfirmed) return;
  }

  targets.forEach((id) => removeLayer(id, options));
  dropFromSelection(targets);
  resetSelectionState();
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
  if (!toRemove) return;
  const snapshot = getPackedLayerSnapshot(toRemove.id);
  layers.splice(index, 1);

  setProjectStore('layers', 'layers', layers);
  setProjectStore('layers', 'state', 'activeLayerId', layers[newActiveIndex].id);
  updateWebGLCanvas(`Layer(${layerId}) removed`);
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

  layerManager.removeLayer(layerId);
};

export const clearLayersFromUser = async (layerIds?: string[]) => {
  const targets = getOperationTargetLayerIds(layerIds);
  if (targets.length === 0) {
    logUserWarn('No layer selected for clear.', { label: LOG_LABEL });
    return;
  }

  if (globalConfig.editor.requireConfirmBeforeLayerClear) {
    const confirmed = await dialog.confirm(
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
  resetSelectionState();
};

export const clearLayerFromUser = async (layerId: string) => {
  await clearLayersFromUser([layerId]);
};

export function clearLayer(layerId: string) {
  const layer = getLayer(layerId);
  layer.commitHistory(undefined, { context: { tool: 'clear' } });
  layer.clear([0, 0, 0, 0]);
  updateWebGLCanvas(`Layer(${layerId}) cleared`);
  updateLayerPreview(layerId);
  logUserInfo(`Layer "${findLayerById(layerId)?.name ?? layerId}" cleared.`, { label: LOG_LABEL });
}

export const allLayers = () => projectStore.layers.layers;
export const findLayerById = (id: string) => allLayers().find((layer) => layer.id === id);
export const activeLayer = () => findLayerById(projectStore.layers.state.activeLayerId) || allLayers()[0];
export const activeIndex = () => allLayers().findIndex((layer) => layer.id === projectStore.layers.state.activeLayerId);

export function setBaseLayerColorMode(colorMode: BaseLayerColorMode, customColor?: string) {
  const updatedBaseLayer = changeBaseLayerColor(projectStore.layers.state.baseLayer, colorMode, customColor);
  setProjectStore('layers', 'state', 'baseLayer', updatedBaseLayer);
  updateWebGLCanvas(`BaseLayer color mode changed to ${colorMode}`);
  setIOStore('isProjectChangedAfterSave', true);
}

export function setBaseLayerCustomColor(customColor: string) {
  const updatedBaseLayer = changeBaseLayerColor(projectStore.layers.state.baseLayer, 'custom', customColor);
  setProjectStore('layers', 'state', 'baseLayer', updatedBaseLayer);
  updateWebGLCanvas(`BaseLayer custom color changed to ${customColor}`);
  setIOStore('isProjectChangedAfterSave', true);
}

export function setSelectionEnabled(enabled: boolean) {
  setProjectStore('layers', 'state', 'selectionEnabled', enabled);
}
export function isSelectionEnabled() {
  return projectStore.layers.state.selectionEnabled;
}

export function selectLayer(layerId: string) {
  if (!findLayerById(layerId)) return;
  setProjectStore('layers', 'state', 'selected', (set: Set<string>) => {
    const updated = new Set(set);
    updated.add(layerId);
    return updated;
  });
}
export function deselectLayer(layerId: string) {
  setProjectStore('layers', 'state', 'selected', (set: Set<string>) => {
    const updated = new Set(set);
    updated.delete(layerId);
    return updated;
  });
}

export function getSelectedLayers(noFallbackToActive: boolean = false): string[] {
  return getOperationTargetLayerIds(undefined, { fallbackToActive: !noFallbackToActive });
}

export const flipLayer = (
  layerId: string,
  options?: {
    flipX?: boolean;
    flipY?: boolean;
  }
) => {
  const layer = getLayer(layerId);
  if (!layer) return;
  FlipEffect.apply(layer, { ...options, context: { tool: 'fx', fxName: 'flip' } });
  updateWebGLCanvas();
};

export const flipAllLayer = (options?: { flipX?: boolean; flipY?: boolean }) => {
  allLayers().forEach((layer) => {
    const frascoLayer = getLayer(layer.id);
    if (frascoLayer) FlipEffect.apply(frascoLayer, { ...options, context: { tool: 'fx', fxName: 'flip' } });
  });
  updateWebGLCanvas();
};

/**
 * @params layerDirection - direction in Layer coordinate. (Use opposite direction if meaning canvas coordinate)
 */
export const rotateAllLayer = (layerDirection: 'cw' | 'ccw') => {
  const beforeSize = { width: projectStore.canvas.size.width, height: projectStore.canvas.size.height };
  const afterSize = { width: beforeSize.height, height: beforeSize.width };
  const layerIds = allLayers().map((l) => l.id);
  const act = new CanvasSizeHistoryAction({
    beforeSize,
    afterSize,
    context: { action: 'rotate', layerDirection, from: 'rotateAllLayer' },
    historyMode: 'layer',
    layerIds,
  });
  for (const layerId of layerIds) {
    const frascoLayer = layerManager.getLayerOptional(layerId);
    if (frascoLayer) {
      frascoLayer.commitHistory(undefined, { silent: true });
    }
  }
  act.registerBefore();

  allLayers().forEach((layer) => {
    const frascoLayer = getLayer(layer.id);
    if (frascoLayer) Rotate90Effect.apply(frascoLayer, { direction: layerDirection, silentHistory: true });
    updateLayerPreview(layer.id);
  });

  setProjectStore('canvas', 'size', afterSize);
  eventBus.emit('canvas:sizeChanged', { newSize: afterSize });
  adjustZoomToFit();

  act.registerAfter();
  projectHistoryController.addAction(act);
  updateWebGLCanvas();
};
