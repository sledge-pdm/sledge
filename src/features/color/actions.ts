import { RGBA } from '@sledge-pdm/core';
import { historyManager } from '~/features/history';
import { ColorChangeCommand } from '~/features/history/command/color/ColorChangeCommand';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { colorStore } from '~/stores/EditorStores';
import { addColorHistory } from './service';

export interface RegisterColorChangeOptions {
  replaceSameColor: boolean;
}

export function registerColorChange(oldColor: RGBA, newColor: RGBA, options?: RegisterColorChangeOptions) {
  if (oldColor === newColor) return;

  const command = new ColorChangeCommand({
    palette: colorStore.currentPalette,
    oldColor,
    newColor,
  });
  historyManager.addEntry(new CommandsHistoryEntry(command));

  // add color history
  addColorHistory(newColor, options);
}
