// Side-effectful operations / state interactions for color feature
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { hexToRGBA } from '~/features/color';
import { ColorHistoryAction } from '~/features/history/actions/ColorHistoryAction';
import { colorStore, setColorStore } from '~/stores/EditorStores';
import { PaletteType } from './palette';

export const currentColor = (): string => {
  return colorStore[colorStore.currentPalette];
};

interface SetCurrentColorOptions {
  noDiff?: boolean;
}

export const setCurrentColor = (colorHexString: string, options?: SetCurrentColorOptions) => {
  const palette = colorStore.currentPalette;
  const oldHex = colorStore[palette];
  const result = setColorStore(palette, colorHexString);
  if (!options?.noDiff) {
    const oldRGBA = hexToRGBA(oldHex);
    const newRGBA = hexToRGBA(colorHexString);
    const action = new ColorHistoryAction(palette as PaletteType, oldRGBA, newRGBA, { from: 'color.service.setCurrentColor' });
    projectHistoryController.addAction(action);
  }
  return result;
};

export const setColor = (palette: PaletteType, colorHexString: string) => {
  return setColorStore(palette, colorHexString);
};
export const selectPalette = (palette: PaletteType) => {
  return setColorStore('currentPalette', palette);
};
