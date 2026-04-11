import { JSX, lazy } from 'solid-js';
import { SECTION_TAB_IDS } from '~/config/SectionTabDefinitions';

const EditorTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.EditorTab })));
const EffectsTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.EffectsTab })));
const ExplorerTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.ExplorerTab })));
const ProjectTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.ProjectTab })));
const ExportTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.ExportTab })));
const HistoryTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.HistoryTab })));
const PerilousTab = lazy(() => import('~/config/SectionTabs').then((mod) => ({ default: mod.PerilousTab })));

export const SECTION_TABS = [
  { id: SECTION_TAB_IDS[0], content: () => <EditorTab /> },
  { id: SECTION_TAB_IDS[1], content: () => <EffectsTab /> },
  { id: SECTION_TAB_IDS[2], content: () => <ExplorerTab /> },
  { id: SECTION_TAB_IDS[3], content: () => <ProjectTab /> },
  { id: SECTION_TAB_IDS[4], content: () => <ExportTab /> },
  { id: SECTION_TAB_IDS[5], content: () => <HistoryTab /> },
  { id: SECTION_TAB_IDS[6], content: () => <PerilousTab /> },
] as const satisfies readonly {
  id: string;
  content: () => JSX.Element;
}[];
