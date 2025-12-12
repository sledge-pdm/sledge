import { DEFAULT_TAB_CONTROLS_BY_SIDE, SECTION_TAB_CONTROLS, SectionTab, SectionTabControl, type SectionSide } from '~/config/SectionTabConfig';

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

export const defaultAppearanceStore: AppearanceStore = {
  leftSide: {
    controls: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide,
    controlsVisibility: {},
    content: DEFAULT_TAB_CONTROLS_BY_SIDE.leftSide[0],
  },
  rightSide: {
    controls: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide,
    controlsVisibility: {},
    content: DEFAULT_TAB_CONTROLS_BY_SIDE.rightSide[0],
  },

  ruler: false,
  onscreenControl: false,
};

const tabSideMap = new Map<SectionTabControl, SectionSide>(SECTION_TAB_CONTROLS.map((tab) => [tab.id as SectionTabControl, tab.defaultSide]));

const sanitizeSideState = (side: SectionSide, source?: Partial<AppearanceStore['leftSide']>): AppearanceStore['leftSide'] => {
  const defaultControls = DEFAULT_TAB_CONTROLS_BY_SIDE[side];
  const rawControls = source?.controls;
  const controlsFromSource = Array.isArray(rawControls)
    ? rawControls
    : rawControls && typeof rawControls === 'object'
      ? (Object.keys(rawControls) as SectionTabControl[])
      : [];

  const controls = controlsFromSource
    .filter((control): control is SectionTabControl => tabSideMap.has(control)) // drop unknown IDs
    .filter((control) => tabSideMap.get(control) === side); // keep only tabs belonging to this side

  const deduped: SectionTabControl[] = [];
  controls.forEach((control) => {
    if (!deduped.includes(control)) deduped.push(control);
  });

  // Add any missing default tabs for this side in their declared order.
  defaultControls.forEach((control) => {
    if (!deduped.includes(control)) deduped.push(control);
  });

  const orderedControls = defaultControls.filter((control) => deduped.includes(control));
  const sanitizedControls = orderedControls.length > 0 ? orderedControls : defaultControls;
  const legacySelectedIndex = (() => {
    const idx = (source as any)?.selectedIndex;
    if (typeof idx !== 'number' || Number.isNaN(idx) || sanitizedControls.length === 0) return undefined;
    return Math.min(Math.max(idx, 0), sanitizedControls.length - 1);
  })();

  const visibilitySource =
    (source?.controlsVisibility as Partial<Record<SectionTabControl, boolean>>) ||
    (typeof rawControls === 'object' && !Array.isArray(rawControls) ? (rawControls as Partial<Record<SectionTabControl, boolean>>) : {});
  const sanitizedVisibility: Partial<Record<SectionTabControl, boolean>> = {};
  sanitizedControls.forEach((control) => {
    const vis = visibilitySource?.[control];
    sanitizedVisibility[control] = typeof vis === 'boolean' ? vis : true;
  });

  const sanitizedContent: SectionTab | undefined = (() => {
    // @ts-expect-error
    if (source?.shown === false) return undefined; // legacy hidden side
    if (source?.content && sanitizedControls.includes(source.content as SectionTabControl)) return source.content;
    if (legacySelectedIndex !== undefined) return sanitizedControls[legacySelectedIndex];
    return sanitizedControls[0];
  })();

  return {
    controls: sanitizedControls,
    controlsVisibility: sanitizedVisibility,
    content: sanitizedContent,
  };
};

export const sanitizeAppearanceStore = (state?: Partial<AppearanceStore>): AppearanceStore => {
  return {
    leftSide: sanitizeSideState('leftSide', state?.leftSide),
    rightSide: sanitizeSideState('rightSide', state?.rightSide),
    ruler: state?.ruler ?? defaultAppearanceStore.ruler,
    onscreenControl: state?.onscreenControl ?? defaultAppearanceStore.onscreenControl,
    explorerPath: state?.explorerPath,
  };
};
