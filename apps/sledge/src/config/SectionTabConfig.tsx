import { JSX, lazy } from 'solid-js';

const EditorTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.EditorTab })));
const EffectsTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.EffectsTab })));
const ExplorerTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.ExplorerTab })));
const ProjectTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.ProjectTab })));
const ExportTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.ExportTab })));
const HistoryTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.HistoryTab })));
const PerilousTab = lazy(() => import('~/components/section/SectionTabs').then((m) => ({ default: m.PerilousTab })));

export type SectionSide = 'leftSide' | 'rightSide';

export const SECTION_TABS = [
  { id: 'editor', content: () => <EditorTab /> },
  { id: 'effects', content: () => <EffectsTab /> },
  { id: 'explorer', content: () => <ExplorerTab /> },
  { id: 'project', content: () => <ProjectTab /> },
  { id: 'export', content: () => <ExportTab /> },
  { id: 'history', content: () => <HistoryTab /> },
  { id: 'danger', content: () => <PerilousTab /> },
] as const satisfies readonly {
  id: string;
  content: () => JSX.Element;
}[];
export type SectionTab = (typeof SECTION_TABS)[number]['id'];

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
