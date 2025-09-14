import { describe, expect, it } from 'vitest';
import { colorMatch, getRandomColorRGBA, hexToRGB, hexToRGBA, isTransparent, RGBAToHex, RGBToHex, transparent } from '~/features/color';

describe('color model helpers', () => {
  it('hex <-> rgb conversions', () => {
    expect(hexToRGB('#112233')).toEqual([0x11, 0x22, 0x33]);
    expect(hexToRGBA('#112233FF')).toEqual([0x11, 0x22, 0x33, 0xff]);
    const rgb: [number, number, number] = [0xaa, 0xbb, 0xcc];
    expect(RGBToHex(rgb)).toBe('aabbcc');
    const rgba: [number, number, number, number] = [0xaa, 0xbb, 0xcc, 0xdd];
    expect(RGBAToHex(rgba)).toBe('aabbccdd');
  });

  it('color match and transparency', () => {
    expect(colorMatch([0, 0, 0, 0], [0, 0, 0, 0])).toBe(true);
    expect(isTransparent(transparent)).toBe(true);
  });

  it('random color alpha fixed', () => {
    const c = getRandomColorRGBA();
    expect(c[3]).toBe(255);
  });
});
