import { beforeEach, describe, expect, it } from 'vitest';
import { getTabContent, getTabContentShownSide, isTabContentShown, showTabContent, toggleTabContent } from '~/features/config/TabContentController';
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

describe('features/config/TabContentController', () => {
  beforeEach(() => {
    resetAppearanceState();
  });

  it('shows hidden tab content on requested side', () => {
    setAppearanceStore('leftSide', 'content', 'editor');
    setAppearanceStore('rightSide', 'content', 'project');

    showTabContent('history', 'leftSide');

    expect(appearanceStore.leftSide.content).toBe('history');
    expect(appearanceStore.rightSide.content).toBe('project');
  });

  it('keeps tab content on currently shown side when showTabContent is called', () => {
    setAppearanceStore('leftSide', 'content', 'editor');
    setAppearanceStore('rightSide', 'content', 'history');

    showTabContent('history', 'leftSide');

    expect(appearanceStore.rightSide.content).toBe('history');
    expect(appearanceStore.leftSide.content).toBe('editor');
  });

  it('toggleTabContent hides content when already shown somewhere', () => {
    setAppearanceStore('rightSide', 'content', 'export');

    toggleTabContent('leftSide', 'export');

    expect(appearanceStore.rightSide.content).toBeUndefined();
  });

  it('toggleTabContent shows content on requested side when hidden', () => {
    setAppearanceStore('leftSide', 'content', undefined);
    setAppearanceStore('rightSide', 'content', undefined);

    toggleTabContent('leftSide', 'effects');

    expect(appearanceStore.leftSide.content).toBe('effects');
  });

  it('reports shown state and shown side for tabs', () => {
    setAppearanceStore('leftSide', 'content', 'effects');
    setAppearanceStore('rightSide', 'content', 'project');

    expect(isTabContentShown('effects')).toBe(true);
    expect(getTabContentShownSide('effects')).toBe('leftSide');
    expect(isTabContentShown('history')).toBe(false);
    expect(getTabContentShownSide('history')).toBeUndefined();
  });

  it('returns fallback null content renderer for unknown tab id', () => {
    const known = getTabContent('editor');
    expect(typeof known).toBe('function');

    const unknown = getTabContent('unknown' as any);
    expect(unknown()).toBeNull();
  });
});
