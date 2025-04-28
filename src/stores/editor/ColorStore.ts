export enum PaletteType {
  primary = 'primary',
  secondary = 'secondary',
}

export type ColorStore = {
  currentPalette: PaletteType;
  primary: string;
  secondary: string;
  swatches: string[];
};
