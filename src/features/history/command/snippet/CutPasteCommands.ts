import { RawPixelData } from '@sledge-pdm/core';
import { LayerAddCommand } from '~/features/history/command/layer/LayerAddCommand';
import { LayerRemoveCommand } from '~/features/history/command/layer/LayerRemoveCommand';
import { HistoryContext } from '~/features/history/types';
import { Layer } from '~/features/layer';
import { CommandLine } from '../../entry/CommandsHistoryEntry';

export const CUT_PASTE_CONTEXT: HistoryContext = {
  icon: '/assets/icons/context_menu/cut.png',
  description: 'cut & paste layer',
};

export function CutPasteCommands(insertIndex: number, srcLayer: Layer, srcBuffer: RawPixelData): CommandLine[] {
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

  return [
    { command: removeCommand, redoOrder: 0, undoOrder: 1 },
    { command: addCommand, redoOrder: 1, undoOrder: 0 },
  ];
}
