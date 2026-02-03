import { RawPixelData } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { logUserInfo } from '~/features/log/service';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { LayerAddCommand } from '../history/command/layer/LayerAddCommand';
import { LayerPropsCommand } from '../history/command/layer/LayerPropsCommand';
import { LayerRemoveCommand } from '../history/command/layer/LayerRemoveCommand';
import { LayerReorderCommand } from '../history/command/layer/LayerReorderCommand';
import { doCommands } from '../history/service';
import { findLayerById, getOperationTargetLayerIds, resetSelectionState } from './service';
import { Layer, LayerType } from './types';

const LOG_LABEL = 'LayerActions';

export interface AddLayerOptions {
  initImage?: RawPixelData;
  register?: boolean;
  uniqueName?: boolean;
}

export function addLayer(
  layer: {
    name?: string;
    type?: LayerType;
    enabled?: boolean;
    opacity?: number;
    mode?: BlendMode;
  },
  options?: AddLayerOptions
) {
  return addLayerTo(0, layer, options);
}

export function addLayerTo(
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
) {
  const { register = true } = options ?? {};
  const uniqueName = options?.uniqueName === undefined ? true : options.uniqueName;

  const command = new LayerAddCommand({
    index,
    layer,
    initImage: options?.initImage,
    uniqueName,
  });
  doCommands(command, { register });
}

export interface RemoveLayerOptions {
  register?: boolean;
}

export function removeLayer(layerId?: string, options?: RemoveLayerOptions) {
  const { register = true } = options ?? {};

  if (layerId === undefined) return;
  const toRemove = findLayerById(layerId);
  if (!toRemove) return;

  const command = new LayerRemoveCommand({ layerId: toRemove.id });
  doCommands(command, { register });
}

export interface ReorderLayerOptions {
  register?: boolean;
}

export function reorderLayer(fromIndex: number, targetIndex: number, options?: ReorderLayerOptions) {
  const { register = true } = options ?? {};

  const beforeOrder = projectStore.layers.layers.map((l) => l.id);
  const updated = [...projectStore.layers.layers];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(targetIndex, 0, moved);
  const afterOrder = updated.map((l) => l.id);

  const command = new LayerReorderCommand({ beforeOrder, afterOrder });
  doCommands(command, { register });
}

interface SetLayerPropOptions {
  register?: boolean;
}

export function setLayerProp<K extends keyof Layer>(layerId: string, propName: K, newValue: Layer[K], options?: SetLayerPropOptions) {
  const { register = true } = options ?? {};
  if (propName === 'id') {
    return;
  }
  const layer = findLayerById(layerId);
  if (!layer) return;
  const beforeValue = layer[propName];
  if (beforeValue === newValue) return;

  const before = { ...layer } as Omit<Layer, 'id'> & { id?: string };
  delete (before as Partial<Layer>).id;
  const after = { ...(before as Omit<Layer, 'id'>), [propName]: newValue };

  const command = new LayerPropsCommand({
    layerId,
    oldLayerProps: before as Omit<Layer, 'id'>,
    newLayerProps: after as Omit<Layer, 'id'>,
  });
  doCommands(command, { register });
}

export function toggleLayerVisibility(layerIds?: string[]) {
  const targets = getOperationTargetLayerIds(layerIds);
  if (targets.length === 0) return;
  const shouldEnable = !targets.every((id) => findLayerById(id)?.enabled);
  targets.forEach((id) => setLayerProp(id, 'enabled', shouldEnable));
  logUserInfo(`Layer visibility ${shouldEnable ? 'enabled' : 'disabled'} for ${targets.length} layer(s).`, { label: LOG_LABEL });
  if (targets.length > 0) resetSelectionState();
}
