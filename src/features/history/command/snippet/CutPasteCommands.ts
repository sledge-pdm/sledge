import { HistoryContext, Layer, RawPixelData } from '@sledge-pdm/core';
import { LayerAddCommand } from '~/features/history/command/layer/LayerAddCommand';
import { LayerRemoveCommand } from '~/features/history/command/layer/LayerRemoveCommand';
import { CommandLine } from '../../entry/CommandsHistoryEntry';

export function cutPasteSnippet(
  insertIndex: number,
  srcLayer: Layer,
  srcBuffer: RawPixelData
): {
  commands: CommandLine[];
  context: HistoryContext;
} {
  const removeCommand = new LayerRemoveCommand({
    layerId: srcLayer.id,
    preserveActive: true,
  });
  const addCommand = new LayerAddCommand({
    index: insertIndex,
    layer: { ...srcLayer, cutFreeze: false },
    initImage: srcBuffer,
    uniqueName: false,
    // preserve id
    overrideLayerId: srcLayer.id,
  });

  const context: HistoryContext = {
    icon: '/assets/icons/context_menu/cut.png',
    description: `paste cut layer / ${srcLayer.name}`,
  };

  return {
    commands: [
      { command: removeCommand, redoOrder: 0, undoOrder: 1 },
      { command: addCommand, redoOrder: 1, undoOrder: 0 },
    ],
    context,
  };
}
