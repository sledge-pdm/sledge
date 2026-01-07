import { describe, expect, it } from 'vitest';
import { PaletteType } from '~/features/color/palette';

describe('PaletteType', () => {
  it('exposes stable string values', () => {
    expect(PaletteType.primary).toBe('primary');
    expect(PaletteType.secondary).toBe('secondary');
  });
});
