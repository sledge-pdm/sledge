import {
  CONTROLS_SPACER,
  DEFAULT_TAB_CONTROLS_BY_SIDE,
  insertControlAtDefaultPlacement,
  isTabControl,
  SECTION_TAB_CONTROLS,
  SectionControlsItem,
  SectionTab,
  SectionTabControl,
  type SectionSide,
} from '~/config/SectionTabDefinitions';

// px, including the panel's border.
export const SIDE_SECTION_WIDTH_LIMITS: Record<SectionSide, { min: number; max: number }> = {
  leftSide: { min: 300, max: 600 },
  rightSide: { min: 300, max: 500 },
};

export type AppearanceStore = {
  leftSide: {
    controls: SectionControlsItem[];
    controlsVisibility: Partial<Record<SectionTabControl, boolean>>;
    content?: SectionTab;
    width: number;
  };
  rightSide: {
    controls: SectionControlsItem[];
    controlsVisibility: Partial<Record<SectionTabControl, boolean>>;
    content?: SectionTab;
    width: number;
  };

  ruler: boolean;
  onscreenControl: boolean;
  explorerPath?: string;
};

export const createDefaultAppearanceStore = (): AppearanceStore => ({
  leftSide: {
    controls: [...DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide],
    controlsVisibility: {},
    content: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide.find(isTabControl),
    width: SIDE_SECTION_WIDTH_LIMITS.leftSide.min,
  },
  rightSide: {
    controls: [...DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide],
    controlsVisibility: {},
    content: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide.find(isTabControl),
    width: SIDE_SECTION_WIDTH_LIMITS.rightSide.min,
  },

  ruler: false,
  onscreenControl: false,
  explorerPath: undefined,
});

export const defaultAppearanceStore: AppearanceStore = createDefaultAppearanceStore();

const tabSideMap = new Map<SectionTabControl, SectionSide>(SECTION_TAB_CONTROLS.map((tab) => [tab.id as SectionTabControl, tab.defaultSide]));

export const sanitizeAppearanceStore = (state?: Partial<AppearanceStore>): AppearanceStore => {
  const base = createDefaultAppearanceStore();

  const filterValid = (controls: any): SectionControlsItem[] =>
    Array.isArray(controls) ? (controls as SectionControlsItem[]).filter((c) => c === CONTROLS_SPACER || tabSideMap.has(c)) : [];

  const leftRaw = filterValid(state?.leftSide?.controls);
  const rightRaw = filterValid(state?.rightSide?.controls);

  const seen = new Set<SectionTabControl>();
  // controls are unique across both sides, while each side keeps its own spacer.
  const dedupe = (arr: SectionControlsItem[]) => {
    let hasSpacer = false;
    return arr.filter((c) => {
      if (!isTabControl(c)) return hasSpacer ? false : (hasSpacer = true);
      return !seen.has(c) ? (seen.add(c), true) : false;
    });
  };

  // state saved before the spacer existed: split its controls by their default placement
  const ensureSpacer = (arr: SectionControlsItem[]) =>
    arr.includes(CONTROLS_SPACER)
      ? arr
      : arr.filter(isTabControl).reduce<SectionControlsItem[]>((items, c) => insertControlAtDefaultPlacement(items, c), [CONTROLS_SPACER]);

  let leftControls = ensureSpacer(dedupe([...leftRaw]));
  let rightControls = ensureSpacer(dedupe([...rightRaw]));

  // Add any missing controls to their default side at their default placement
  SECTION_TAB_CONTROLS.forEach((def) => {
    if (!seen.has(def.id)) {
      if (def.defaultSide === 'leftSide') {
        leftControls = insertControlAtDefaultPlacement(leftControls, def.id);
      } else {
        rightControls = insertControlAtDefaultPlacement(rightControls, def.id);
      }
      seen.add(def.id);
    }
  });

  const buildVisibility = (
    controls: SectionControlsItem[],
    source?: Partial<Record<SectionTabControl, boolean>>
  ): Partial<Record<SectionTabControl, boolean>> => {
    const result: Partial<Record<SectionTabControl, boolean>> = {};
    controls.filter(isTabControl).forEach((c) => {
      const vis = source?.[c];
      result[c] = typeof vis === 'boolean' ? vis : true;
    });
    return result;
  };

  const leftVisibility = buildVisibility(leftControls, state?.leftSide?.controlsVisibility);
  const rightVisibility = buildVisibility(rightControls, state?.rightSide?.controlsVisibility);

  const pickContent = (content: SectionTab | undefined, controls: SectionControlsItem[], fallback?: SectionTab) =>
    content && controls.includes(content as SectionTabControl) ? content : (controls.find(isTabControl) ?? fallback);

  const leftContent = pickContent(state?.leftSide?.content, leftControls, base.leftSide.content);
  const rightContent = pickContent(state?.rightSide?.content, rightControls, base.rightSide.content);

  const pickWidth = (side: SectionSide, width: unknown) => {
    if (typeof width !== 'number' || !Number.isFinite(width)) return base[side].width;
    const { min, max } = SIDE_SECTION_WIDTH_LIMITS[side];
    return Math.min(max, Math.max(min, width));
  };

  return {
    leftSide: {
      controls: leftControls,
      controlsVisibility: leftVisibility,
      content: leftContent,
      width: pickWidth('leftSide', state?.leftSide?.width),
    },
    rightSide: {
      controls: rightControls,
      controlsVisibility: rightVisibility,
      content: rightContent,
      width: pickWidth('rightSide', state?.rightSide?.width),
    },
    ruler: state?.ruler ?? base.ruler,
    onscreenControl: state?.onscreenControl ?? base.onscreenControl,
    explorerPath: state?.explorerPath ?? base.explorerPath,
  };
};
