import { PaletteType } from '~/stores/editor/ColorStore';
import { colorStore, setColorStore } from '~/stores/EditorStores';

export const currentColor = (): string => {
  return colorStore[colorStore.currentPalette];
};
export const setCurrentColor = (colorHexString: string) => {
  return setColorStore(colorStore.currentPalette, colorHexString);
};
export const setColor = (palette: PaletteType, colorHexString: string) => {
  return setColorStore(palette, colorHexString);
};
export const selectPalette = (palette: PaletteType) => {
  return setColorStore('currentPalette', palette);
};
