import { describe, expect, it } from 'vitest';
import { DEFAULT_TAB_CONTROLS_BY_SIDE } from '~/config/SectionTabConfig';
import { defaultAppearanceStore, sanitizeAppearanceStore, SIDE_SECTION_WIDTH_LIMITS } from '~/stores/editor/AppearanceStore';

describe('sanitizeAppearanceStore', () => {
  it('returns defaults when state is undefined', () => {
    const sanitized = sanitizeAppearanceStore();

    expect(sanitized).toEqual({
      leftSide: {
        controls: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide,
        controlsVisibility: {
          editor: true,
          effects: true,
          explorer: true,
        },
        content: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0],
        width: SIDE_SECTION_WIDTH_LIMITS.leftSide.min,
      },
      rightSide: {
        controls: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide,
        controlsVisibility: {
          project: true,
          export: true,
          history: true,
        },
        content: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide[0],
        width: SIDE_SECTION_WIDTH_LIMITS.rightSide.min,
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
        controlsVisibility: { editor: false },
        // @ts-expect-error unknown content
        content: 'unknown',
      },
      // @ts-expect-error missing controlsVisibility
      rightSide: {
        controls: ['project'], // missing export/history
        content: 'project',
      },
    });

    expect(sanitized.leftSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide);
    expect(sanitized.rightSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide);
    expect(sanitized.leftSide.controlsVisibility).toEqual({
      editor: false,
      effects: true,
      explorer: true,
    });
    expect(sanitized.rightSide.controlsVisibility).toEqual({
      project: true,
      export: true,
      history: true,
    });
    expect(sanitized.leftSide.content).toBe(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0]);
    expect(sanitized.rightSide.content).toBe('project');
  });

  it('places a spacer by default placement when the stored controls have none', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: { controls: ['explorer', 'editor', 'effects'], controlsVisibility: {}, width: 300 },
      rightSide: { controls: ['history', 'project', 'export'], controlsVisibility: {}, width: 300 },
    });

    expect(sanitized.leftSide.controls).toEqual(['editor', 'effects', 'spacer', 'explorer']);
    expect(sanitized.rightSide.controls).toEqual(['history', 'project', 'export', 'spacer']);
  });

  it('keeps the stored spacer position and one spacer per side', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: { controls: ['spacer', 'editor', 'spacer', 'effects', 'explorer'], controlsVisibility: {}, content: 'editor', width: 300 },
      rightSide: { controls: ['project', 'spacer', 'export', 'history'], controlsVisibility: {}, width: 300 },
    });

    expect(sanitized.leftSide.controls).toEqual(['spacer', 'editor', 'effects', 'explorer']);
    expect(sanitized.rightSide.controls).toEqual(['project', 'spacer', 'export', 'history']);
    expect(sanitized.leftSide.controlsVisibility).toEqual({ editor: true, effects: true, explorer: true });
  });

  it('never picks the spacer as content', () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: { controls: ['spacer', 'effects', 'editor', 'explorer'], controlsVisibility: {}, width: 300 },
    } as any);

    expect(sanitized.leftSide.content).toBe('effects');
  });

  it('accepts controls defined as visibility map object', () => {
    const sanitized = sanitizeAppearanceStore({
      // @ts-expect-error missing width (state saved before widths were stored)
      leftSide: {
        // legacy-like object form
        controls: {
          editor: false,
          explorer: true,
        } as any,
        controlsVisibility: { explorer: false },
      },
    });

    expect(sanitized.leftSide.controls).toEqual(DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide);
    expect(sanitized.leftSide.controlsVisibility).toEqual({
      editor: true,
      effects: true,
      explorer: false,
    });
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

    expect(sanitized.leftSide.content).toBe('editor');
    expect(sanitized.rightSide.content).toBe('project');
  });

  it("keeps stored panel widths, clamped to each side's limits", () => {
    const sanitized = sanitizeAppearanceStore({
      leftSide: { controls: ['editor'], controlsVisibility: {}, width: 420 },
      rightSide: { controls: ['project'], controlsVisibility: {}, width: 9999 },
    });

    expect(sanitized.leftSide.width).toBe(420);
    expect(sanitized.rightSide.width).toBe(SIDE_SECTION_WIDTH_LIMITS.rightSide.max);
  });

  it('falls back to the default width when the stored one is missing or not a number', () => {
    const sanitized = sanitizeAppearanceStore({
      // @ts-expect-error missing width (state saved before widths were stored)
      leftSide: { controls: ['editor'], controlsVisibility: {} },
      rightSide: { controls: ['project'], controlsVisibility: {}, width: 'wide' as any },
    });

    expect(sanitized.leftSide.width).toBe(defaultAppearanceStore.leftSide.width);
    expect(sanitized.rightSide.width).toBe(defaultAppearanceStore.rightSide.width);
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

    expect(sanitized.leftSide.content).toBe('effects');
  });
});
