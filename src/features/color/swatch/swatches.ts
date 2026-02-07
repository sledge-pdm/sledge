export interface Swatch {
  name: string;
  colors: string[];
}

export const DEFAULT: Swatch = {
  name: 'default',
  colors: [
    '#000000', // Black
    '#FFFFFF', // White
    '#ffff00', // Yellow
    '#00ffff', // Cyan
    '#00ff00', // Green
    '#ff00ff', // Magenta
    '#ff0000', // Red
    '#0000ff', // Blue
    '#000080', // Indigo
    '#400080', // Purple
  ],
};

export const SMPTE: Swatch = {
  name: 'smpte',
  colors: [
    '#c0c0c0', // Argent
    '#c0c000', // Acid Green,
    '#00c000', // Islamic Green
    '#00c0c0', // Turquoise Surf
    '#c000c0', // Deep Magenta
    '#c00000', // UE Red
    '#0000c0', // Medium Blue
    '#131313', // Chinese Black
    '#00214c', // Oxford Blue
    '#ffffff', // White
    '#32006a', // Deep Violet
    '#090909', // Vampire Black
    '#1d1d1d', // Eerie Black
  ],
};
