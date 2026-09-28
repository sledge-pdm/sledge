export type SectionSide = 'leftSide' | 'rightSide';

export const SECTION_TAB_IDS = ['editor', 'effects', 'explorer', 'project', 'export', 'history'] as const;
export type SectionTab = (typeof SECTION_TAB_IDS)[number];

export const SECTION_TAB_CONTROLS = [
  { id: 'editor', defaultSide: 'leftSide', defaultOrder: 1, bottomControl: false },
  { id: 'effects', defaultSide: 'leftSide', defaultOrder: 2, bottomControl: false },
  { id: 'explorer', defaultSide: 'leftSide', defaultOrder: 3, bottomControl: true },
  { id: 'project', defaultSide: 'rightSide', defaultOrder: 1, bottomControl: false },
  { id: 'export', defaultSide: 'rightSide', defaultOrder: 2, bottomControl: false },
  { id: 'history', defaultSide: 'rightSide', defaultOrder: 3, bottomControl: false },
] as const satisfies readonly {
  id: SectionTab;
  defaultSide: SectionSide;
  defaultOrder: number;
  bottomControl: boolean;
}[];
export type SectionTabControl = (typeof SECTION_TAB_CONTROLS)[number]['id'];
export type SectionTabControlDefinition = (typeof SECTION_TAB_CONTROLS)[number];

// an invisible item that sits in each side's controls list. controls before it are packed to the top,
// controls after it to the bottom. it is not draggable, but controls can be moved across it.
export const CONTROLS_SPACER = 'spacer' as const;
export type SectionControlsItem = SectionTabControl | typeof CONTROLS_SPACER;

export const isTabControl = (item: SectionControlsItem): item is SectionTabControl => item !== CONTROLS_SPACER;

// top-placed controls go right before the spacer, bottom-placed ones at the end of the list.
export const insertControlAtDefaultPlacement = (items: SectionControlsItem[], control: SectionTabControl): SectionControlsItem[] => {
  const bottom = SECTION_TAB_CONTROLS.find((c) => c.id === control)?.bottomControl ?? false;
  const spacerIndex = items.indexOf(CONTROLS_SPACER);
  if (bottom || spacerIndex < 0) return [...items, control];
  return [...items.slice(0, spacerIndex), control, ...items.slice(spacerIndex)];
};

const controlsBySide = (side: SectionSide): SectionControlsItem[] =>
  SECTION_TAB_CONTROLS.filter((tab) => tab.defaultSide === side)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .reduce<SectionControlsItem[]>((items, tab) => insertControlAtDefaultPlacement(items, tab.id), [CONTROLS_SPACER]);

export const DEFAULT_TAB_CONTROLS_BY_SIDE: Record<SectionSide, SectionControlsItem[]> = {
  leftSide: controlsBySide('leftSide'),
  rightSide: controlsBySide('rightSide'),
};
