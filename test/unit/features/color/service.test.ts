import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Consts } from '~/Consts';
import { PaletteType } from '~/features/color/palette';

const mocks = vi.hoisted(() => ({
  saveEditorStateDebounced: vi.fn(),
}));

vi.mock('~/features/io/editor/save', () => ({
  saveEditorStateDebounced: mocks.saveEditorStateDebounced,
}));

import {
  addColorHistory,
  currentColor,
  getColorHistory,
  getCurrentSwatch,
  getPaletteColor,
  selectPalette,
  setCurrentColor,
  setCurrentSwatch,
  setPaletteColor,
} from '~/features/color/service';
import { colorStore, setColorStore } from '~/stores/EditorStores';
import { defaultColorStore } from '~/stores/editor/ColorStore';

function resetColorState() {
  setColorStore('currentPalette', defaultColorStore.currentPalette);
  setColorStore('palettes', { ...defaultColorStore.palettes });
  setColorStore('swatches', [...defaultColorStore.swatches]);
  setColorStore('history', []);
  setColorStore('currentSwatchName', defaultColorStore.currentSwatchName);
}

describe('features/color/service', () => {
  beforeEach(() => {
    resetColorState();
    mocks.saveEditorStateDebounced.mockReset();
  });

  it('reads and updates colors for current palette and explicit palette', () => {
    setPaletteColor(PaletteType.primary, [1, 2, 3, 255]);
    setPaletteColor(PaletteType.secondary, [4, 5, 6, 255]);
    expect(getPaletteColor(PaletteType.primary)).toEqual([1, 2, 3, 255]);
    expect(getPaletteColor(PaletteType.secondary)).toEqual([4, 5, 6, 255]);

    selectPalette(PaletteType.secondary);
    expect(currentColor()).toEqual([4, 5, 6, 255]);

    setCurrentColor([10, 20, 30, 255]);
    expect(currentColor()).toEqual([10, 20, 30, 255]);
    expect(colorStore.palettes.primary).toEqual([1, 2, 3, 255]);
  });

  it('resolves current swatch by name', () => {
    const secondSwatchName = colorStore.swatches[1].name;
    setCurrentSwatch(secondSwatchName);
    expect(getCurrentSwatch()?.name).toBe(secondSwatchName);

    setCurrentSwatch('missing');
    expect(getCurrentSwatch()).toBeUndefined();
  });

  it('prepends color history and triggers editor-state save', () => {
    addColorHistory([9, 8, 7, 255]);

    expect(getColorHistory()).toEqual([[9, 8, 7, 255]]);
    expect(mocks.saveEditorStateDebounced).toHaveBeenCalledTimes(1);
  });

  it('replaces same color entries when replaceSameColor is enabled', () => {
    setColorStore('history', [
      [1, 2, 3, 255],
      [4, 5, 6, 255],
      [1, 2, 3, 255],
    ]);

    addColorHistory([1, 2, 3, 255], { replaceSameColor: true });

    expect(getColorHistory()).toEqual([
      [1, 2, 3, 255],
      [4, 5, 6, 255],
    ]);
  });

  it('trims history to maxColorHistoryLength', () => {
    const existing = Array.from({ length: Consts.maxColorHistoryLength }, (_, i) => [i, 0, 0, 255] as [number, number, number, number]);
    setColorStore('history', existing);

    addColorHistory([200, 1, 1, 255]);

    expect(getColorHistory()).toHaveLength(Consts.maxColorHistoryLength);
    expect(getColorHistory()[0]).toEqual([200, 1, 1, 255]);
    expect(getColorHistory().at(-1)).toEqual([Consts.maxColorHistoryLength - 2, 0, 0, 255]);
  });
});
