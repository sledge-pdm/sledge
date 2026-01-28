import { beforeEach, describe, expect, it } from 'vitest';
import { PaletteType } from '~/features/color';
import { ColorChangeCommand } from '~/features/history/command/color/ColorChangeCommand';
import { colorStore, setColorStore } from '~/stores/EditorStores';

type Palette = typeof colorStore.palettes;

const basePalettes: Palette = {
  primary: [0, 0, 0, 255] as const,
  secondary: [255, 255, 255, 255] as const,
};

describe('ColorChangeCommand (e2e)', () => {
  beforeEach(() => {
    setColorStore('currentPalette', PaletteType.primary);
    setColorStore('palettes', {
      primary: [...basePalettes.primary],
      secondary: [...basePalettes.secondary],
    });
  });

  it('applies forward/backward and exposes context', () => {
    const command = new ColorChangeCommand({
      palette: PaletteType.primary,
      oldColor: [0, 0, 0, 255],
      newColor: [10, 20, 30, 255],
    });

    command.forward();
    expect(colorStore.palettes.primary).toEqual([10, 20, 30, 255]);

    command.backward();
    expect(colorStore.palettes.primary).toEqual([0, 0, 0, 255]);

    const context = command.getContext();
    expect(context.description).toContain('->');
  });
});
