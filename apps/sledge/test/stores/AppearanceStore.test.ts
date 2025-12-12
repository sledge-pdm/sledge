import { describe, expect, it } from 'vitest';

import { DEFAULT_TAB_CONTROLS_BY_SIDE } from '~/config/SectionTabConfig';
import { defaultAppearanceStore, sanitizeAppearanceStore } from '~/stores/editor/AppearanceStore';

describe('sanitizeAppearanceStore', () => {
  it('returns defaults when state is undefined', () => {
    const sanitized = sanitizeAppearanceStore();

    expect(sanitized).toEqual({
      leftSide: {
        controls: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide,
        content: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0],
      },
      rightSide: {
        controls: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide,
        content: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide[0],
      },
      ruler: defaultAppearanceStore.ruler,
      onscreenControl: defaultAppearanceStore.onscreenControl,
      explorerPath: undefined,
    });
  });

  it('drops unknown tabs, de-duplicates, and appends missing defaults in order', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        controls: ['editor', 'unknown' as any, 'editor'], // duplicate + unknown
      // @ts-expect-error unknown content
        content: 'unknown',
      },
      rightSide: {
        controls: ['project'], // missing export/history
        content: 'project',
      },
    });

    expect(sanitized.leftSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide);
    expect(sanitized.leftSide.content).toBe(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0]);
    expect(sanitized.rightSide.content).toBe('project');
  });

  it('drops tabs that belong to the opposite side', () => {
    const sanitized = sanitizeAppearanceStore({
      // @ts-expect-error legacy property
      leftSide: { shown: true, tabs: [], content: undefined },
      // @ts-expect-error legacy property
      rightSide: { shown: true, tabs: ['editor', 'project'], content: 'editor' },
    });

    expect(sanitized.leftSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide);
    expect(sanitized.leftSide.content).toBe(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0]);
    expect(sanitized.rightSide.content).toBe(DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide[0]);
  });

  it('resolves legacy selectedIndex when selectedTab is absent', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        controls: ['editor', 'effects'],
        // legacy index
        // @ts-expect-error legacy property
        selectedIndex: 1,
      },
      rightSide: {
        controls: ['project'],
        // out of bounds legacy index should clamp to last
        // @ts-expect-error legacy property
        selectedIndex: 10,
      },
    });

    expect(sanitized.leftSide.content).toBe('effects');
    expect(sanitized.rightSide.content).toBe('history');
  });

  it('treats legacy shown=false as hidden (selectedTab undefined)', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: {
        controls: ['editor', 'effects'],
        content: 'effects',
        // @ts-expect-error legacy property
        shown: false,
      },
    });

    expect(sanitized.leftSide.content).toBeUndefined();
  });
});
