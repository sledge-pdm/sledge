export type SectionSide = 'leftSide' | 'rightSide';

export const SECTION_TAB_IDS = ['editor', 'effects', 'explorer', 'project', 'export', 'history', 'danger'] as const;
export type SectionTab = (typeof SECTION_TAB_IDS)[number];

export const SECTION_TAB_CONTROLS = [
  { id: 'editor', defaultSide: 'leftSide', defaultOrder: 1 },
  { id: 'effects', defaultSide: 'leftSide', defaultOrder: 2 },
  { id: 'explorer', defaultSide: 'leftSide', defaultOrder: 3 },
  { id: 'project', defaultSide: 'rightSide', defaultOrder: 1 },
  { id: 'export', defaultSide: 'rightSide', defaultOrder: 2 },
  { id: 'history', defaultSide: 'rightSide', defaultOrder: 3 },
] as const satisfies readonly {
  id: SectionTab;
  defaultSide: SectionSide;
  defaultOrder: number;
}[];
export type SectionTabControl = (typeof SECTION_TAB_CONTROLS)[number]['id'];
export type SectionTabControlDefinition = (typeof SECTION_TAB_CONTROLS)[number];

const controlsBySide = (side: SectionSide): SectionTabControl[] =>
  SECTION_TAB_CONTROLS.filter((tab) => tab.defaultSide === side)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map((tab) => tab.id);

export const DEFAULT_TAB_CONTROLS_BY_SIDE: Record<SectionSide, SectionTabControl[]> = {
  leftSide: controlsBySide('leftSide'),
  rightSide: controlsBySide('rightSide'),
};
