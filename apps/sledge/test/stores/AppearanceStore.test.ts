import { describe, expect, it } from 'vitest';

import { DEFAULT_TABS_BY_SIDE } from '~/config/SectionTabConfig';
import { defaultAppearanceStore, sanitizeAppearanceStore } from '~/stores/editor/AppearanceStore';

describe('sanitizeAppearanceStore', () => {
  it('returns defaults when state is undefined', () => {
    const sanitized = sanitizeAppearanceStore();

    expect(sanitized).toEqual({
      leftSide: {
        shown: defaultAppearanceStore.leftSide.shown,
        tabs: DEFAULT_TABS_BY_SIDE.leftSide,
        selectedIndex: 0,
      },
      rightSide: {
        shown: defaultAppearanceStore.rightSide.shown,
        tabs: DEFAULT_TABS_BY_SIDE.rightSide,
        selectedIndex: 0,
      },
      ruler: defaultAppearanceStore.ruler,
      onscreenControl: defaultAppearanceStore.onscreenControl,
      explorerPath: undefined,
    });
  });

  it('drops unknown tabs, de-duplicates, and appends missing defaults in order', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        shown: true,
        tabs: ['editor', 'unknown' as any, 'editor'], // duplicate + unknown
        selectedIndex: 1,
      },
      rightSide: {
        shown: true,
        tabs: ['project'], // missing export/history
        selectedIndex: 0,
      },
    });

    expect(sanitized.leftSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.rightSide);
  });

  it('drops tabs that belong to the opposite side', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: { shown: true, tabs: [], selectedIndex: 0 },
      rightSide: { shown: true, tabs: ['editor', 'project'], selectedIndex: 0 },
    });

    expect(sanitized.leftSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.rightSide);
  });

  it('clamps selectedIndex within range and defaults when out of bounds', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        shown: true,
        tabs: ['editor'],
        selectedIndex: 10, // too large
      },
      rightSide: {
        shown: true,
        tabs: ['project'],
        selectedIndex: -5, // negative
      },
    });

    expect(sanitized.leftSide.selectedIndex).toBe(sanitized.leftSide.tabs.length - 1);
    expect(sanitized.rightSide.selectedIndex).toBe(0);
  });

  it('preserves shown flags when provided and falls back when omitted', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        shown: false,
        tabs: DEFAULT_TABS_BY_SIDE.leftSide,
        selectedIndex: 0,
      },
      // @ts-ignore
      rightSide: {
        tabs: DEFAULT_TABS_BY_SIDE.rightSide,
        selectedIndex: 0,
      },
    });

    expect(sanitized.leftSide.shown).toBe(false);
    expect(sanitized.rightSide.shown).toBe(defaultAppearanceStore.rightSide.shown);
  });
});
