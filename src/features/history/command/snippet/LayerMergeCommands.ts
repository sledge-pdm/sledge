import { transparent } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { FrascoLayerCommand } from '~/features/history/command/frasco/FrascoLayerCommand';
import { LayerPropsCommand } from '~/features/history/command/layer/LayerPropsCommand';
import { LayerRemoveCommand } from '~/features/history/command/layer/LayerRemoveCommand';
import { SetActiveLayerCommand } from '~/features/history/command/layer_list/SetActiveLayerCommand';
import { CommandLine } from '~/features/history/entry/CommandsHistoryEntry';
import { HistoryContext } from '~/features/history/types';
import { findLayerById, getLayerIndex } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import type { Layer } from '~/features/layer/types';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { frascoRenderer } from '~/webgl/FrascoRenderer';

const stripId = (layer: Layer): Omit<Layer, 'id'> => {
  const { id: _id, ...rest } = layer;
  return rest;
};

export function layerMergeSnippet(
  originId: string,
  targetId: string,
  options?: { contextTool?: string }
): {
  commands: CommandLine[];
  context?: HistoryContext;
} {
  const origin = findLayerById(originId);
  const target = findLayerById(targetId);
  if (!origin || !target)
    return {
      commands: [],
    };

  if (getLayerIndex(originId) < 0 || getLayerIndex(targetId) < 0)
    return {
      commands: [],
    };

  const targetFrascoLayer = layerManager.getLayerOptional(targetId);
  if (!targetFrascoLayer)
    return {
      commands: [],
    };

  const renderer = frascoRenderer;
  if (!renderer)
    return {
      commands: [],
    };

  const snapshot = targetFrascoLayer.captureHistory();
  renderer.renderLayersToLayer([origin, target], targetFrascoLayer, transparent);
  if (snapshot) {
    targetFrascoLayer.pushHistory(snapshot, { silent: true, context: { tool: options?.contextTool ?? 'merge' } });
  }

  const targetOld = stripId(target);
  const targetNew: Omit<Layer, 'id'> = { ...targetOld, mode: BlendMode.normal, opacity: 1.0 };

  const targetPropsCommand = new LayerPropsCommand({ layerId: targetId, oldLayerProps: targetOld, newLayerProps: targetNew });
  const originRemoveCommand = new LayerRemoveCommand({ layerId: originId, preserveActive: true });

  const needActiveSwap = projectStore.layers.state.activeLayerId === originId;
  const setActiveCommand = needActiveSwap ? new SetActiveLayerCommand({ layerId: targetId }) : undefined;

  const frascoCommand = new FrascoLayerCommand({ layerId: targetId, context: { tool: options?.contextTool ?? 'merge' } });

  const commands: CommandLine[] = [
    { command: frascoCommand, redoOrder: 0, undoOrder: 2 },
    { command: targetPropsCommand, redoOrder: 1, undoOrder: 1 },
  ];
  if (setActiveCommand) {
    commands.push({ command: setActiveCommand, redoOrder: 2, undoOrder: 3 });
  }
  commands.push({ command: originRemoveCommand, redoOrder: 3, undoOrder: 0 });

  const context: HistoryContext = {
    icon: '/assets/icons/context_menu/merge_down.png',
    description: `merge / ${origin.name} > ${target.name}`,
  };

  return { commands, context };
}
