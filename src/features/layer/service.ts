// Layer domain service - Stateful layer operations with external dependencies

import { BaseLayerColorMode, HistoryContext, Layer, LayerType } from '@sledge-pdm/core';
import { BlendMode, FlipEffect, Rotate90Effect } from '@sledge-pdm/frasco';
import { adjustZoomToFit } from '~/features/canvas';
import { historyManager } from '~/features/history';
import { CanvasSizeCommand, layerMergeSnippet } from '~/features/history/commands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { doCommands } from '~/features/history/service';
import { getLayer, layerManager } from '~/features/layer/frasco/LayerManager';
import { logUserError, logUserInfo, logUserWarn } from '~/features/log/service';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove, cancelSelection } from '~/features/selection/service';
import { setIOStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { dialog } from '~/utils/platform';
import { updateFrascoCanvas } from '~/webgl/service';
import { selectionManager } from '../selection/SelectionManager';
import { addLayer, removeLayer, RemoveLayerOptions } from './actions';
import { changeBaseLayerColor } from './model';

const LOG_LABEL = 'LayerService';

export const NEW_LAYER_PROPS: Omit<Layer, 'id'> = {
  name: 'layer 1',
  type: LayerType.Dot,
  enabled: true,
  opacity: 1,
  mode: BlendMode.normal,
  cutFreeze: false,
};

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
  updateFrascoCanvas(`Layer(${layerId}) duplicated`);
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
  const { commands, context } = layerMergeSnippet(originLayer.id, targetLayer.id, { contextTool: 'merge' });
  doCommands(commands, { context });
  logUserInfo(`Layer "${originLayer.name}" merged into "${targetLayer.name}".`, { label: LOG_LABEL });
}

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

export function getOperationTargetLayerIds(layerIds?: string[], options?: { fallbackToActive?: boolean; order?: LayerOrder }) {
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
  updateFrascoCanvas(`Reset all layers`);

  adjustZoomToFit();
};

export const removeLayerFromUser = async (layerId: string, options?: RemoveLayerOptions) => {
  await removeLayersFromUser([layerId], options);
};
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
  updateFrascoCanvas(`Layer(${layerId}) cleared`);
  logUserInfo(`Layer "${findLayerById(layerId)?.name ?? layerId}" cleared.`, { label: LOG_LABEL });
}

export const allLayers = () => projectStore.layers.layers;
export const findLayerById = (id: string) => allLayers().find((layer) => layer.id === id);
export const activeLayer = () => findLayerById(projectStore.layers.state.activeLayerId) || allLayers()[0];
export const activeIndex = () => allLayers().findIndex((layer) => layer.id === projectStore.layers.state.activeLayerId);

export function setBaseLayerColorMode(colorMode: BaseLayerColorMode, customColor?: string) {
  const updatedBaseLayer = changeBaseLayerColor(projectStore.layers.state.baseLayer, colorMode, customColor);
  setProjectStore('layers', 'state', 'baseLayer', updatedBaseLayer);
  updateFrascoCanvas(`BaseLayer color mode changed to ${colorMode}`);
  setIOStore('isProjectChangedAfterSave', true);
}

export function setBaseLayerCustomColor(customColor: string) {
  const updatedBaseLayer = changeBaseLayerColor(projectStore.layers.state.baseLayer, 'custom', customColor);
  setProjectStore('layers', 'state', 'baseLayer', updatedBaseLayer);
  updateFrascoCanvas(`BaseLayer custom color changed to ${customColor}`);
  setIOStore('isProjectChangedAfterSave', true);
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
  updateFrascoCanvas();
};

export const flipAllLayer = (options?: { flipX?: boolean; flipY?: boolean }) => {
  allLayers().forEach((layer) => {
    const frascoLayer = getLayer(layer.id);
    if (frascoLayer) FlipEffect.apply(frascoLayer, { ...options, context: { tool: 'fx', fxName: 'flip' } });
  });
  updateFrascoCanvas();
};

/**
 * @params layerDirection - direction in Layer coordinate. (Use opposite direction if meaning canvas coordinate)
 */
export const rotateAllLayer = (layerDirection: 'cw' | 'ccw') => {
  const beforeSize = { width: projectStore.canvas.size.width, height: projectStore.canvas.size.height };
  const afterSize = { width: beforeSize.height, height: beforeSize.width };
  const layerIds = allLayers().map((l) => l.id);
  const command = new CanvasSizeCommand({
    beforeSize,
    afterSize,
    historyMode: 'layer',
    layerIds,
  });
  for (const layerId of layerIds) {
    const frascoLayer = layerManager.getLayerOptional(layerId);
    if (frascoLayer) {
      frascoLayer.commitHistory(undefined, { silent: true });
    }
  }
  command.registerBefore();

  allLayers().forEach((layer) => {
    const frascoLayer = getLayer(layer.id);
    if (frascoLayer) Rotate90Effect.apply(frascoLayer, { direction: layerDirection, silentHistory: true });
  });

  setProjectStore('canvas', 'size', afterSize);
  selectionManager.resize(afterSize);
  adjustZoomToFit();

  command.registerAfter();
  const context: HistoryContext = {
    icon: layerDirection === 'cw' ? '/assets/icons/actions/canvas_rotate_counterclockwise.png' : '/assets/icons/actions/canvas_rotate_clockwise.png',
    description: 'rotate canvas',
  };
  historyManager.addEntry(new CommandsHistoryEntry(command, context));
  updateFrascoCanvas();
};
