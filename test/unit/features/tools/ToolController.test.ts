import { LayerType } from '@sledge-pdm/core';
import { BlendMode } from '@sledge-pdm/frasco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveEditorStateDebounced: vi.fn(),
  logSystemInfo: vi.fn(),
}));

vi.mock('~/features/io/editor/save', () => ({
  saveEditorStateDebounced: mocks.saveEditorStateDebounced,
}));

vi.mock('~/features/log/service', () => ({
  logSystemInfo: mocks.logSystemInfo,
}));

import {
  getCurrentCanvasMargin,
  getCurrentPresetConfig,
  getPresetOf,
  getSelectedPreset,
  getSelectedPresetName,
  getToolCategory,
  isToolAllowedInCurrentLayer,
  setActiveToolCategory,
  setActiveToolPreset,
  updateToolPresetConfig,
} from '~/features/tools/ToolController';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

describe('features/tools/ToolController', () => {
  beforeEach(() => {
    setToolStore('activeToolCategory', 'pen');
    setToolStore('prevActiveCategory', undefined);
    setToolStore('tools', 'pen', 'presets', 'selected', 'default');
    setToolStore('tools', 'pen', 'presets', 'options', 'default', 'size', 1);
    setToolStore('tools', 'eraser', 'presets', 'selected', 'default');
    setToolStore('tools', 'eraser', 'presets', 'options', 'default', 'size', 1);
    setProjectStore('layers', 'layers', [
      {
        id: 'layer-1',
        name: 'Layer 1',
        type: LayerType.Dot,
        enabled: true,
        opacity: 1,
        mode: BlendMode.normal,
        cutFreeze: false,
      },
    ]);
    setProjectStore('layers', 'state', 'activeLayerId', 'layer-1');

    mocks.saveEditorStateDebounced.mockReset();
    mocks.logSystemInfo.mockReset();
  });

  it('returns preset by tool id or category object', () => {
    const category = getToolCategory('pen');

    expect(getPresetOf('pen', 'default')).toEqual(category.presets?.options.default);
    expect(getPresetOf(category, 'default')).toEqual(category.presets?.options.default);
    expect(getPresetOf('move', 'default')).toBeUndefined();
  });

  it('returns selected preset when available', () => {
    const penCategory = getToolCategory('pen');

    expect(getSelectedPreset(penCategory)).toEqual(penCategory.presets?.options.default);
    expect(getSelectedPresetName('pen')).toBe('default');
    expect(getSelectedPreset(getToolCategory('move'))).toBeUndefined();
  });

  it('updates active tool category and records previous category', () => {
    setActiveToolCategory('eraser');

    expect(toolStore.activeToolCategory).toBe('eraser');
    expect(toolStore.prevActiveCategory).toBe('pen');
    expect(mocks.logSystemInfo).toHaveBeenCalledTimes(1);
  });

  it('skips update when active category is unchanged', () => {
    setActiveToolCategory('pen');

    expect(toolStore.activeToolCategory).toBe('pen');
    expect(toolStore.prevActiveCategory).toBeUndefined();
    expect(mocks.logSystemInfo).not.toHaveBeenCalled();
  });

  it('updates preset config and triggers debounced editor save', () => {
    updateToolPresetConfig('pen', 'default', 'size', 12);

    expect(getCurrentPresetConfig('pen')).toEqual(expect.objectContaining({ size: 12 }));
    expect(mocks.saveEditorStateDebounced).toHaveBeenCalledTimes(1);
  });

  it('switches active preset name', () => {
    setToolStore('tools', 'pen', 'presets', 'options', 'alt', { size: 6, shape: 'square' });

    setActiveToolPreset('pen', 'alt');

    expect(getSelectedPresetName('pen')).toBe('alt');
    expect(getCurrentPresetConfig('pen')).toEqual(expect.objectContaining({ size: 6 }));
  });

  it('returns brush margin for pen and eraser presets', () => {
    setToolStore('activeToolCategory', 'pen');
    setToolStore('tools', 'pen', 'presets', 'options', 'default', 'size', 14);
    expect(getCurrentCanvasMargin()).toBe(14);

    setToolStore('activeToolCategory', 'eraser');
    setToolStore('tools', 'eraser', 'presets', 'options', 'default', 'size', 5);
    expect(getCurrentCanvasMargin()).toBe(5);

    setToolStore('activeToolCategory', 'fill');
    expect(getCurrentCanvasMargin()).toBe(0);
  });

  it('checks current layer enabled flag for tool availability', () => {
    setProjectStore('layers', 'layers', (layers) => [{ ...layers[0], enabled: true }]);
    expect(isToolAllowedInCurrentLayer()).toBe(true);

    setProjectStore('layers', 'layers', (layers) => [{ ...layers[0], enabled: false }]);
    expect(isToolAllowedInCurrentLayer()).toBe(false);
  });
});
