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
        selectedTab: DEFAULT_TABS_BY_SIDE.leftSide[0],
      },
      rightSide: {
        shown: defaultAppearanceStore.rightSide.shown,
        tabs: DEFAULT_TABS_BY_SIDE.rightSide,
        selectedTab: DEFAULT_TABS_BY_SIDE.rightSide[0],
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
        // @ts-ignore
        selectedTab: 'unknown',
      },
      rightSide: {
        shown: true,
        tabs: ['project'], // missing export/history
        selectedTab: 'project',
      },
    });

    expect(sanitized.leftSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.rightSide);
  });

  it('drops tabs that belong to the opposite side', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: { shown: true, tabs: [], selectedTab: undefined },
      rightSide: { shown: true, tabs: ['editor', 'project'], selectedTab: 'editor' },
    });

    expect(sanitized.leftSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.tabs).toEqual(DEFAULT_TABS_BY_SIDE.rightSide);
    expect(sanitized.leftSide.selectedTab).toBe(DEFAULT_TABS_BY_SIDE.leftSide[0]);
    expect(sanitized.rightSide.selectedTab).toBe(DEFAULT_TABS_BY_SIDE.rightSide[0]);
  });

  it('resolves legacy selectedIndex when selectedTab is absent', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        shown: true,
        tabs: ['editor', 'effects'],
        // legacy index
        // @ts-expect-error legacy property
        selectedIndex: 1,
      },
      rightSide: {
        shown: true,
        tabs: ['project'],
        // out of bounds legacy index should clamp to last
        // @ts-expect-error legacy property
        selectedIndex: 10,
      },
    });

    expect(sanitized.leftSide.selectedTab).toBe('effects');
    expect(sanitized.rightSide.selectedTab).toBe('history');
  });

  it('preserves shown flags when provided and falls back when omitted', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        shown: false,
        tabs: DEFAULT_TABS_BY_SIDE.leftSide,
        selectedTab: DEFAULT_TABS_BY_SIDE.leftSide[0],
      },
      // @ts-ignore
      rightSide: {
        tabs: DEFAULT_TABS_BY_SIDE.rightSide,
        selectedTab: DEFAULT_TABS_BY_SIDE.rightSide[0],
      },
    });

    expect(sanitized.leftSide.shown).toBe(false);
    expect(sanitized.rightSide.shown).toBe(defaultAppearanceStore.rightSide.shown);
  });
});
