import { beforeEach, describe, expect, it } from 'vitest';
import { currentColor, PaletteType, selectPalette, setColor } from '~/features/color';
import { ColorHistoryAction } from '~/features/history';

describe('ColorHistoryAction', () => {
  beforeEach(() => {
    selectPalette(PaletteType.primary);
    setColor(PaletteType.primary, '#000000');
  });
  it('undo/redo applies palette color', () => {
    const act = new ColorHistoryAction(PaletteType.primary, [0, 0, 0, 255], [255, 0, 0, 255], { from: 'test' });
    act.redo();
    expect(currentColor()).toBe('#ff0000');
    act.undo();
    expect(currentColor()).toBe('#000000');
  });
});
