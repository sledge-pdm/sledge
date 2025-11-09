// Side-effectful operations / state interactions for color feature
import { colorMatch, RGBAColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import { ColorHistoryAction } from '~/features/history/actions/ColorHistoryAction';
import { colorStore, setColorStore } from '~/stores/EditorStores';
import { PaletteType } from './palette';

export const currentColor = (): string => {
  return colorStore[colorStore.currentPalette];
};

export const setCurrentColor = (colorHexString: string) => {
  const palette = colorStore.currentPalette;
  // const oldHex = colorStore[palette];
  const result = setColorStore(palette, colorHexString);
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

interface AddColorHistoryOptions {
  replaceSameColor: boolean;
}
export const addColorHistory = (color: RGBAColor, options?: AddColorHistoryOptions) => {
  setColorStore('history', (old) => {
    if (options?.replaceSameColor) {
      old = old.filter((c) => !colorMatch(c, color));
    }
    return [color, ...old].slice(0, 50);
  });
};

interface RegisterColorChangeOptions {
  replaceSameColor: boolean;
}

export const registerColorChange = (oldColor: RGBAColor, newColor: RGBAColor, options?: RegisterColorChangeOptions) => {
  if (oldColor === newColor) return;

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
  addColorHistory(newColor, options);
};
