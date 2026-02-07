import { DEFAULT_TAB_CONTROLS_BY_SIDE, SECTION_TAB_CONTROLS, SectionTab, SectionTabControl, type SectionSide } from '~/config/SectionTabDefinitions';

export type AppearanceStore = {
  leftSide: {
    controls: SectionTabControl[];
    controlsVisibility: Partial<Record<SectionTabControl, boolean>>;
    content?: SectionTab;
  };
  rightSide: {
    controls: SectionTabControl[];
    controlsVisibility: Partial<Record<SectionTabControl, boolean>>;
    content?: SectionTab;
  };

  ruler: boolean;
  onscreenControl: boolean;
  explorerPath?: string;
};

export const createDefaultAppearanceStore = (): AppearanceStore => ({
  leftSide: {
    controls: [...DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide],
    controlsVisibility: {},
    content: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0],
  },
  rightSide: {
    controls: [...DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide],
    controlsVisibility: {},
    content: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide[0],
  },

  ruler: false,
  onscreenControl: false,
  explorerPath: undefined,
});

export const defaultAppearanceStore: AppearanceStore = createDefaultAppearanceStore();

const tabSideMap = new Map<SectionTabControl, SectionSide>(SECTION_TAB_CONTROLS.map((tab) => [tab.id as SectionTabControl, tab.defaultSide]));

export const sanitizeAppearanceStore = (state?: Partial<AppearanceStore>): AppearanceStore => {
  const base = createDefaultAppearanceStore();

  const filterValid = (controls: any): SectionTabControl[] =>
    Array.isArray(controls) ? (controls as SectionTabControl[]).filter((c) => tabSideMap.has(c)) : [];

  const leftRaw = filterValid(state?.leftSide?.controls);
  const rightRaw = filterValid(state?.rightSide?.controls);

  const seen = new Set<SectionTabControl>();
  const dedupe = (arr: SectionTabControl[]) => arr.filter((c) => (!seen.has(c) ? (seen.add(c), true) : false));

  let leftControls = dedupe([...leftRaw]);
  let rightControls = dedupe([...rightRaw]);

  // Append any missing controls to their default side in default order
  SECTION_TAB_CONTROLS.forEach((def) => {
    if (!seen.has(def.id)) {
      if (def.defaultSide === 'leftSide') {
        leftControls.push(def.id);
      } else {
        rightControls.push(def.id);
      }
      seen.add(def.id);
    }
  });

  const buildVisibility = (
    controls: SectionTabControl[],
    source?: Partial<Record<SectionTabControl, boolean>>
  ): Partial<Record<SectionTabControl, boolean>> => {
    const result: Partial<Record<SectionTabControl, boolean>> = {};
    controls.forEach((c) => {
      const vis = source?.[c];
      result[c] = typeof vis === 'boolean' ? vis : true;
    });
    return result;
  };

  const leftVisibility = buildVisibility(leftControls, state?.leftSide?.controlsVisibility);
  const rightVisibility = buildVisibility(rightControls, state?.rightSide?.controlsVisibility);

  const pickContent = (content: SectionTab | undefined, controls: SectionTabControl[], fallback?: SectionTab) =>
    content && controls.includes(content as SectionTabControl) ? content : (controls[0] ?? fallback);

  const leftContent = pickContent(state?.leftSide?.content, leftControls, base.leftSide.content);
  const rightContent = pickContent(state?.rightSide?.content, rightControls, base.rightSide.content);

  return {
    leftSide: {
      controls: leftControls,
      controlsVisibility: leftVisibility,
      content: leftContent,
    },
    rightSide: {
      controls: rightControls,
      controlsVisibility: rightVisibility,
      content: rightContent,
    },
    ruler: state?.ruler ?? base.ruler,
    onscreenControl: state?.onscreenControl ?? base.onscreenControl,
    explorerPath: state?.explorerPath ?? base.explorerPath,
  };
};
