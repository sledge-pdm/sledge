// Side-effectful operations / state interactions for color feature
import { colorMatch, RGBA } from '@sledge/anvil';
import { Consts } from '~/Consts';
import { projectHistoryController } from '~/features/history';
import { ColorHistoryAction } from '~/features/history/actions/ColorHistoryAction';
import { saveEditorStateDebounced } from '~/features/io/editor/save';
import { colorStore, setColorStore } from '~/stores/EditorStores';
import { PaletteType } from './palette';

export const currentColor = (): RGBA => {
  return colorStore.palettes[colorStore.currentPalette];
};

export const getPaletteColor = (type: PaletteType) => {
  return colorStore.palettes[type];
};

export const setCurrentColor = (color: RGBA) => {
  const result = setColorStore('palettes', colorStore.currentPalette, color);
  return result;
};
export const setPaletteColor = (palette: PaletteType, color: RGBA) => {
  return setColorStore('palettes', palette, color);
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

export const addColorHistory = (color: RGBA, options?: AddColorHistoryOptions) => {
  setColorStore('history', (old) => {
    if (options?.replaceSameColor) {
      old = old.filter((c) => !colorMatch(c, color));
    }
    return [color, ...old].slice(0, Consts.maxColorHistoryLength);
  });

  saveEditorStateDebounced();
};

interface RegisterColorChangeOptions {
  replaceSameColor: boolean;
}

export const registerColorChange = (oldColor: RGBA, newColor: RGBA, options?: RegisterColorChangeOptions) => {
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
