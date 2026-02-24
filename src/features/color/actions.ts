import { RGBA } from '@sledge-pdm/core';
import { registerCommandsHistory } from '~/features/history';
import { ColorChangeCommand } from '~/features/history/commands';
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
  registerCommandsHistory(command);

  // add color history
  addColorHistory(newColor, options);
}
