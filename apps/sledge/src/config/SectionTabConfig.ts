export type SideSection = 'leftSide' | 'rightSide';

export const SECTION_TAB_DEFINITIONS = [
  { id: 'editor', defaultSide: 'leftSide', defaultOrder: 1 },
  { id: 'effects', defaultSide: 'leftSide', defaultOrder: 2 },
  { id: 'explorer', defaultSide: 'leftSide', defaultOrder: 3 },
  { id: 'project', defaultSide: 'rightSide', defaultOrder: 1 },
  { id: 'export', defaultSide: 'rightSide', defaultOrder: 2 },
  { id: 'history', defaultSide: 'rightSide', defaultOrder: 3 },
  // Reserved tab that may be enabled for advanced/experimental use.
  { id: 'danger', defaultSide: 'leftSide', defaultOrder: 99 },
] as const satisfies readonly {
  id: string;
  defaultSide: SideSection;
  defaultOrder: number;
}[];

export type SectionTab = (typeof SECTION_TAB_DEFINITIONS)[number]['id'];
export type SectionTabDefinition = (typeof SECTION_TAB_DEFINITIONS)[number];

const tabsBySide = (side: SideSection) =>
  SECTION_TAB_DEFINITIONS.filter((tab) => tab.defaultSide === side)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map((tab) => tab.id);

export const DEFAULT_TABS_BY_SIDE: Record<SideSection, SectionTab[]> = {
  leftSide: tabsBySide('leftSide'),
  rightSide: tabsBySide('rightSide'),
};
