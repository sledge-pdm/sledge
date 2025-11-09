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

  ruler: boolean;
};

export const defaultAppearanceStore: AppearanceStore = {
  leftSide: {
    shown: true,
    tabs: ['editor', 'effects', 'explorer'],
    // tabs: ['editor', 'effects', 'explorer', 'danger'],
    selectedIndex: 0,
  },
  rightSide: {
    shown: false,
    tabs: ['project', 'export', 'history'],
    selectedIndex: 0,
  },

  ruler: false,
};
