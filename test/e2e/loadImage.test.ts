import { colorMatch, RGBA } from '@sledge-pdm/core';
import { describe, expect, it } from 'vitest';
import { loadImageData } from '../support/e2e';

describe('test loading webp image', () => {
  it('load', async () => {
    const image = await loadImageData(new URL('./loadImage.webp', import.meta.url));

    const expectedLength = 16 * 16 * 4;
    // left-top color
    const expectedLTColor: RGBA = [151, 108, 65, 255];

    expect(image.data.byteLength).toBe(expectedLength);
    const imageLTColor: RGBA = [image.data[0], image.data[1], image.data[2], image.data[3]];
    expect(colorMatch(imageLTColor, expectedLTColor)).toBe(true);
  });
});
