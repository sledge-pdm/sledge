export type SideSection = 'leftSide' | 'rightSide';

export const SECTION_TAB_DEFINITIONS = [
  { id: 'editor', defaultSide: 'leftSide', defaultOrder: 1, operable: true },
  { id: 'effects', defaultSide: 'leftSide', defaultOrder: 2, operable: true },
  { id: 'explorer', defaultSide: 'leftSide', defaultOrder: 3, operable: true },
  { id: 'project', defaultSide: 'rightSide', defaultOrder: 1, operable: true },
  { id: 'export', defaultSide: 'rightSide', defaultOrder: 2, operable: true },
  { id: 'history', defaultSide: 'rightSide', defaultOrder: 3, operable: true },
  { id: 'danger', defaultSide: 'leftSide', defaultOrder: 99, operable: false },
] as const satisfies readonly {
  id: string;
  defaultSide: SideSection;
  defaultOrder: number;
  operable: boolean;
}[];

export type SectionTab = (typeof SECTION_TAB_DEFINITIONS)[number]['id'];
export type SectionTabDefinition = (typeof SECTION_TAB_DEFINITIONS)[number];

export const getTabDefinition = (tab: SectionTab): SectionTabDefinition | undefined => SECTION_TAB_DEFINITIONS.find((def) => tab === def.id);

const tabsBySide = (side: SideSection) =>
  SECTION_TAB_DEFINITIONS.filter((tab) => tab.defaultSide === side)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map((tab) => tab.id);

export const DEFAULT_TABS_BY_SIDE: Record<SideSection, SectionTab[]> = {
  leftSide: tabsBySide('leftSide'),
  rightSide: tabsBySide('rightSide'),
};
