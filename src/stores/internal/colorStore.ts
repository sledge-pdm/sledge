import { createStore } from 'solid-js/store';

// color

export enum PaletteType {
  primary = 'primary',
  secondary = 'secondary',
}

export const [colorStore, setColorStore] = createStore({
  currentPalette: 'primary' as PaletteType,
  primary: '#000000', // 通常の描画色
  secondary: '#ffffff', // 背景・消しゴムなど
  swatches: [
    '#000000',
    '#FFFFFF',
    '#ffff00',
    '#00ffff',
    '#00ff00',
    '#ff00ff',
    '#ff0000',
    '#0000ff',
    '#000080',
    '#400080',
  ],
});

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
