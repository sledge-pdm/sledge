import { JSX } from 'solid-js';
import {
  DEFAULT_TAB_CONTROLS_BY_SIDE,
  SECTION_TAB_CONTROLS,
  SECTION_TAB_IDS,
  SectionSide,
  SectionTab,
  SectionTabControl,
  type SectionTabControlDefinition,
} from '~/config/SectionTabDefinitions';
import { EditorTab, EffectsTab, ExplorerTab, ExportTab, HistoryTab, PerilousTab, ProjectTab } from '~/config/SectionTabs';

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

export { DEFAULT_TAB_CONTROLS_BY_SIDE, SECTION_TAB_CONTROLS, SECTION_TAB_IDS, type SectionSide, type SectionTab, type SectionTabControl };
export type { SectionTabControlDefinition };
