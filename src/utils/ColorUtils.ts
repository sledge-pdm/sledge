export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];

export const transparent: RGBAColor = [0, 0, 0, 0];

// "#rrggbb" -> r/g/b
export function hexToRGB(hex: string): RGBColor {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// "#rrggbbaa" -> r/g/b/a
export function hexToRGBA(hex: string): RGBAColor {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let a = parseInt(hex.slice(7, 9), 16);
  if (!a) a = 255;
  return [r, g, b, a];
}

// "#rrggbb" -> r/g/b
export function RGBToHex(color: RGBColor): string {
  const rHex = color[0].toString(16).padStart(2, '0');
  const gHex = color[1].toString(16).padStart(2, '0');
  const bHex = color[2].toString(16).padStart(2, '0');
  return `${rHex}${gHex}${bHex}`;
}

// "#rrggbbaa" -> r/g/b/a
export function RGBAToHex(color: RGBAColor, excludeAlpha?: boolean): string {
  const rHex = color[0].toString(16).padStart(2, '0');
  const gHex = color[1].toString(16).padStart(2, '0');
  const bHex = color[2].toString(16).padStart(2, '0');
  if (excludeAlpha) {
    return `${rHex}${gHex}${bHex}`;
  } else {
    const aHex = color[3].toString(16).padStart(2, '0');
    return `${rHex}${gHex}${bHex}${aHex}`;
  }
}

export function colorMatch(a: RGBAColor, b: RGBAColor): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

export function isTransparent(a: RGBAColor): boolean {
  return a[3] === 0 || a[3] === undefined;
}
