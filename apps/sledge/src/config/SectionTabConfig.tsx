import { JSX, lazy } from 'solid-js';

const loadTabs = () => import('~/config/SectionTabs');
// Vitest 実行時は遅延読み込みで重い UI コンポーネントの副作用を避ける
const isVitest = process.env.VITEST === 'true';
const tabs = isVitest ? null : await loadTabs();
type TabsModule = Awaited<ReturnType<typeof loadTabs>>;
type TabKey = keyof TabsModule;

const loadTab = (key: TabKey): TabsModule[TabKey] => {
  if (isVitest) {
    return lazy(() => loadTabs().then((m) => ({ default: m[key] }))) as TabsModule[TabKey];
  }
  return tabs![key];
};

const EditorTab = loadTab('EditorTab');
const EffectsTab = loadTab('EffectsTab');
const ExplorerTab = loadTab('ExplorerTab');
const ProjectTab = loadTab('ProjectTab');
const ExportTab = loadTab('ExportTab');
const HistoryTab = loadTab('HistoryTab');
const PerilousTab = loadTab('PerilousTab');

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
