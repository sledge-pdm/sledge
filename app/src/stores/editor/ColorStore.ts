import { RGBA } from '@sledge/anvil';
import { PaletteType } from '~/features/color';
import { DEFAULT, SMPTE, Swatch } from '~/features/color/swatch/swatches';

export type ColorStore = {
  currentPalette: PaletteType;
  palettes: Record<PaletteType, RGBA>;
  swatches: Swatch[];
  history: RGBA[];
  currentSwatchName: string;
};

export const defaultColorStore: ColorStore = {
  currentPalette: 'primary' as PaletteType,
  palettes: {
    primary: [0, 0, 0, 255],
    secondary: [255, 255, 255, 255],
  },
  // primary: '#000000', // 通常の描画色
  // secondary: '#ffffff', // 背景・消しゴムなど
  swatches: [DEFAULT, SMPTE],
  history: [],
  currentSwatchName: DEFAULT.name,
};
