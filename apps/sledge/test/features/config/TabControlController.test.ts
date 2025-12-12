import { beforeEach, describe, expect, it } from 'vitest';

import { getTabControlSide, isTabControlVisible, toggleTabControlVisibility } from '~/features/config/TabControlController';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';
import { sanitizeAppearanceStore } from '~/stores/editor/AppearanceStore';

describe('TabControlController', () => {
  beforeEach(() => {
    setAppearanceStore(sanitizeAppearanceStore());
  });

  it('is visible by default and can be toggled off/on', () => {
    expect(isTabControlVisible('editor')).toBe(true);

    toggleTabControlVisibility('editor');
    expect(isTabControlVisible('editor')).toBe(false);
    expect(appearanceStore.leftSide.controls).toContain('editor');

    toggleTabControlVisibility('editor');
    expect(isTabControlVisible('editor')).toBe(true);
  });

  it('re-inserts control to default side if missing before toggling', () => {
    setAppearanceStore('leftSide', 'controls', []);
    setAppearanceStore('leftSide', 'controlsVisibility', {});

    expect(getTabControlSide('editor')).toBeUndefined();
    toggleTabControlVisibility('editor');

    expect(getTabControlSide('editor')).toBe('leftSide');
    expect(appearanceStore.leftSide.controls).toEqual(['editor']);
    expect(isTabControlVisible('editor')).toBe(true);
  });
});
