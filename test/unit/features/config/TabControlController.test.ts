import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveEditorStateImmediate: vi.fn(),
}));

vi.mock('~/features/io/editor/save', () => ({
  saveEditorStateImmediate: mocks.saveEditorStateImmediate,
}));

import {
  getTabControl,
  getTabControlSide,
  isTabControlVisible,
  moveTabControl,
  toggleTabControlVisibility,
} from '~/features/config/TabControlController';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';
import { createDefaultAppearanceStore } from '~/stores/editor/AppearanceStore';

function resetAppearanceState() {
  const defaults = createDefaultAppearanceStore();
  setAppearanceStore('leftSide', {
    controls: [...defaults.leftSide.controls],
    controlsVisibility: { ...defaults.leftSide.controlsVisibility },
    content: defaults.leftSide.content,
  });
  setAppearanceStore('rightSide', {
    controls: [...defaults.rightSide.controls],
    controlsVisibility: { ...defaults.rightSide.controlsVisibility },
    content: defaults.rightSide.content,
  });
  setAppearanceStore('ruler', defaults.ruler);
  setAppearanceStore('onscreenControl', defaults.onscreenControl);
  setAppearanceStore('explorerPath', defaults.explorerPath);
}

describe('features/config/TabControlController', () => {
  beforeEach(() => {
    resetAppearanceState();
    mocks.saveEditorStateImmediate.mockReset();
  });

  it('resolves tab control definition and side', () => {
    expect(getTabControl('editor')?.defaultSide).toBe('leftSide');
    expect(getTabControlSide('editor')).toBe('leftSide');
    expect(getTabControlSide('project')).toBe('rightSide');
  });

  it('moves a control across sides and transfers selected content', () => {
    setAppearanceStore('leftSide', 'content', 'editor');

    moveTabControl('editor', 'rightSide', 1);

    expect(appearanceStore.leftSide.controls).toEqual(['effects', 'explorer']);
    expect(appearanceStore.rightSide.controls).toEqual(['project', 'editor', 'export', 'history']);
    expect(appearanceStore.leftSide.content).toBeUndefined();
    expect(appearanceStore.rightSide.content).toBe('editor');
    expect(appearanceStore.leftSide.controlsVisibility.editor).toBeUndefined();
    expect(appearanceStore.rightSide.controlsVisibility.editor).toBe(true);
    expect(mocks.saveEditorStateImmediate).toHaveBeenCalledTimes(1);
  });

  it('reorders controls within same side and falls back to first visible content when needed', () => {
    setAppearanceStore('leftSide', 'content', 'project' as any);

    moveTabControl('editor', 'leftSide', 2);

    expect(appearanceStore.leftSide.controls).toEqual(['effects', 'explorer', 'editor']);
    expect(appearanceStore.leftSide.content).toBe('effects');
    expect(mocks.saveEditorStateImmediate).toHaveBeenCalledTimes(1);
  });

  it('toggles visibility for mounted controls', () => {
    setAppearanceStore('leftSide', 'controlsVisibility', 'editor', false);
    expect(isTabControlVisible('editor')).toBe(false);

    toggleTabControlVisibility('editor');
    expect(isTabControlVisible('editor')).toBe(true);

    toggleTabControlVisibility('editor');
    expect(isTabControlVisible('editor')).toBe(false);
    expect(mocks.saveEditorStateImmediate).toHaveBeenCalledTimes(2);
  });

  it('mounts control to its default side when toggled from hidden state', () => {
    setAppearanceStore('rightSide', 'controls', ['export', 'history']);
    expect(getTabControlSide('project')).toBeUndefined();

    toggleTabControlVisibility('project');

    expect(getTabControlSide('project')).toBe('rightSide');
    expect(appearanceStore.rightSide.controls).toEqual(['export', 'history', 'project']);
    expect(isTabControlVisible('project')).toBe(true);
    expect(mocks.saveEditorStateImmediate).toHaveBeenCalledTimes(1);
  });
});
