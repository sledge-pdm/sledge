import { SectionTab } from '~/components/section/SectionTabs';

export type AppearanceStore = {
  leftSide: {
    shown: boolean;
    tabs: SectionTab[];
    selectedIndex: number;
  };
  rightSide: {
    shown: boolean;
    tabs: SectionTab[];
    selectedIndex: number;
  };
};

export const defaultAppearanceStore: AppearanceStore = {
  leftSide: {
    shown: true,
    tabs: ['editor', 'effects', 'files', 'danger'],
    selectedIndex: 0,
  },
  rightSide: {
    shown: false,
    tabs: ['project', 'export', 'snapshot', 'history'],
    selectedIndex: 0,
  },
};
