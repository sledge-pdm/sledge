// Side-effectful operations / state interactions for color feature
import { hexToRGBA, RGBAColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
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
    const action = new ColorHistoryAction({
      palette,
      oldColor: oldRGBA,
      newColor: newRGBA,
      context: { from: 'color.service.setCurrentColor' },
    });
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

export const getCurrentSwatch = () => {
  return colorStore.swatches.find((swatch) => swatch.name === colorStore.currentSwatchName);
};
export const setCurrentSwatch = (swatchName: string) => {
  return setColorStore('currentSwatchName', swatchName);
};

export const getColorHistory = () => {
  return colorStore.history;
};
export const addColorHistory = (color: RGBAColor) => {
  setColorStore('history', (old) => {
    return [color, ...old].slice(0, 50);
  });
};

export const registerColorChange = (oldColor: RGBAColor, newColor: RGBAColor) => {
  // add project history
  const action = new ColorHistoryAction({
    palette: colorStore.currentPalette,
    oldColor,
    newColor,
    context: {
      from: 'registerColorChange',
    },
  });
  projectHistoryController.addAction(action);

  // add color history
  addColorHistory(newColor);
};
