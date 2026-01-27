import { RawPixelData } from '@sledge-pdm/core';
import { Layer } from '~/features/layer';
import { LayerAddCommand } from '../LayerAddCommand';
import { LayerRemoveCommand } from '../LayerRemoveCommand';
import { CommandLine } from '../../entry/CommandsHistoryEntry';

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
