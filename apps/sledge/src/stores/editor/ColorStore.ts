import { PaletteType, RGBAColor } from '~/features/color';
import { DEFAULT, SMPTE, Swatch } from '~/features/color/swatch/swatches';

export type ColorStore = {
  currentPalette: PaletteType;
  primary: string;
  secondary: string;
  swatches: Swatch[];
  history: RGBAColor[];
  currentSwatchName: string;
};

export const defaultColorStore: ColorStore = {
  currentPalette: 'primary' as PaletteType,
  primary: '#000000', // 通常の描画色
  secondary: '#ffffff', // 背景・消しゴムなど
  swatches: [DEFAULT, SMPTE],
  history: [],
  currentSwatchName: DEFAULT.name,
};
