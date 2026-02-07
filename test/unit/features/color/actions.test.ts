import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addEntry: vi.fn(),
  saveEditorStateDebounced: vi.fn(),
}));

vi.mock('~/features/history', () => ({
  historyManager: {
    addEntry: mocks.addEntry,
  },
}));

vi.mock('~/features/io/editor/save', () => ({
  saveEditorStateDebounced: mocks.saveEditorStateDebounced,
}));

import { registerColorChange } from '~/features/color/actions';
import { PaletteType } from '~/features/color/palette';
import { colorStore, setColorStore } from '~/stores/EditorStores';
import { defaultColorStore } from '~/stores/editor/ColorStore';

function resetColorState() {
  setColorStore('currentPalette', defaultColorStore.currentPalette);
  setColorStore('palettes', { ...defaultColorStore.palettes });
  setColorStore('swatches', [...defaultColorStore.swatches]);
  setColorStore('history', []);
  setColorStore('currentSwatchName', defaultColorStore.currentSwatchName);
}

describe('features/color/actions', () => {
  beforeEach(() => {
    resetColorState();
    mocks.addEntry.mockReset();
    mocks.saveEditorStateDebounced.mockReset();
  });

  it('does nothing when old and new color references are identical', () => {
    const color: [number, number, number, number] = [10, 20, 30, 255];

    registerColorChange(color, color);

    expect(mocks.addEntry).not.toHaveBeenCalled();
    expect(colorStore.history).toEqual([]);
    expect(mocks.saveEditorStateDebounced).not.toHaveBeenCalled();
  });

  it('registers history entry and appends color history for changed color', () => {
    setColorStore('currentPalette', PaletteType.secondary);
    const oldColor: [number, number, number, number] = [0, 0, 0, 255];
    const newColor: [number, number, number, number] = [120, 130, 140, 255];

    registerColorChange(oldColor, newColor, { replaceSameColor: false });

    expect(mocks.addEntry).toHaveBeenCalledTimes(1);
    const entry = mocks.addEntry.mock.calls[0][0];
    const line = entry.getCommandLines()[0];
    expect(line.command.type).toBe('color');
    expect(line.command.serializeProps()).toEqual({
      palette: PaletteType.secondary,
      oldColor,
      newColor,
    });

    expect(colorStore.history[0]).toEqual(newColor);
    expect(mocks.saveEditorStateDebounced).toHaveBeenCalledTimes(1);
  });

  it('passes replaceSameColor option through history update behavior', () => {
    const oldColor: [number, number, number, number] = [1, 1, 1, 255];
    const newColor: [number, number, number, number] = [7, 7, 7, 255];
    setColorStore('history', [newColor, [2, 2, 2, 255], newColor]);

    registerColorChange(oldColor, newColor, { replaceSameColor: true });

    expect(colorStore.history).toEqual([newColor, [2, 2, 2, 255]]);
  });
});
