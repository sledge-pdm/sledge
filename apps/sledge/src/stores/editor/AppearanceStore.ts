import { DEFAULT_TABS_BY_SIDE, SECTION_TAB_DEFINITIONS, type SectionTab, type SideSection } from '~/config/SectionTabConfig';

export type AppearanceStore = {
  leftSide: {
    shown: boolean;
    tabs: SectionTab[];
    selectedTab?: SectionTab;
  };
  rightSide: {
    shown: boolean;
    tabs: SectionTab[];
    selectedTab?: SectionTab;
  };

  ruler: boolean;
  onscreenControl: boolean;
  explorerPath?: string;
};

const defaultShown: Record<SideSection, boolean> = {
  leftSide: true,
  rightSide: false,
};

export const defaultAppearanceStore: AppearanceStore = {
  leftSide: {
    shown: defaultShown.leftSide,
    tabs: DEFAULT_TABS_BY_SIDE.leftSide,
    selectedTab: DEFAULT_TABS_BY_SIDE.leftSide[0],
  },
  rightSide: {
    shown: defaultShown.rightSide,
    tabs: DEFAULT_TABS_BY_SIDE.rightSide,
    selectedTab: DEFAULT_TABS_BY_SIDE.rightSide[0],
  },

  ruler: false,
  onscreenControl: false,
};

const tabSideMap = new Map<SectionTab, SideSection>(SECTION_TAB_DEFINITIONS.map((tab) => [tab.id, tab.defaultSide]));

const sanitizeSideState = (side: SideSection, source?: Partial<AppearanceStore['leftSide']>): AppearanceStore['leftSide'] => {
  const defaultTabs = DEFAULT_TABS_BY_SIDE[side];
  const tabsFromSource = Array.isArray(source?.tabs) ? source?.tabs : [];

  const tabs = tabsFromSource
    .filter((tab): tab is SectionTab => tabSideMap.has(tab)) // drop unknown IDs
    .filter((tab) => tabSideMap.get(tab) === side); // keep only tabs belonging to this side

  const deduped: SectionTab[] = [];
  tabs.forEach((tab) => {
    if (!deduped.includes(tab)) deduped.push(tab);
  });

  // Add any missing default tabs for this side in their declared order.
  defaultTabs.forEach((tab) => {
    if (!deduped.includes(tab)) deduped.push(tab);
  });

  const sanitizedTabs = deduped.length > 0 ? deduped : defaultTabs;
  const legacySelectedIndex = (() => {
    const idx = (source as any)?.selectedIndex;
    if (typeof idx !== 'number' || Number.isNaN(idx) || sanitizedTabs.length === 0) return undefined;
    return Math.min(Math.max(idx, 0), sanitizedTabs.length - 1);
  })();

  const sanitizedSelectedTab: SectionTab = (() => {
    if (source?.selectedTab && sanitizedTabs.includes(source.selectedTab)) return source.selectedTab;
    if (legacySelectedIndex !== undefined) return sanitizedTabs[legacySelectedIndex];
    return sanitizedTabs[0];
  })();
  const sanitizedShown = source?.shown ?? defaultShown[side];

  return {
    shown: sanitizedShown,
    tabs: sanitizedTabs,
    selectedTab: sanitizedSelectedTab,
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
