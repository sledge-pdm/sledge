// Controller to manage tab content (not controls).

import { JSX } from 'solid-js';
import { SECTION_TABS, SectionSide, SectionTab } from '~/config/SectionTabConfig';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';

export const showTabContent = (tab: SectionTab, appearSide: SectionSide) => {
  const shownSide = getTabContentShownSide(tab);
  if (shownSide) {
    // keep shown if shown
    setAppearanceStore(shownSide, 'content', tab);
  } else {
    // if not shown in anywhere, show in specified side
    setAppearanceStore(appearSide, 'content', tab);
  }
};

export const toggleTabContent = (side: SectionSide, tab: SectionTab) => {
  const shownSide = getTabContentShownSide(tab);
  if (shownSide) {
    // hide it from the side whichever the content is shown in
    setAppearanceStore(shownSide, 'content', undefined);
  } else {
    // is not shown in anywhere
    setAppearanceStore(side, 'content', tab);
  }
};

export const isTabContentShown = (tab: SectionTab): boolean => {
  const isSelectedInSomewhere = appearanceStore.leftSide.content === tab || appearanceStore.rightSide.content === tab;
  return isSelectedInSomewhere;
};

export const getTabContentShownSide = (tab: SectionTab): SectionSide | undefined => {
  if (appearanceStore.leftSide.content === tab) return 'leftSide';
  if (appearanceStore.rightSide.content === tab) return 'rightSide';
  return undefined;
};

export const getTabContent = (tab: SectionTab): (() => JSX.Element) => {
  const foundTab = SECTION_TABS.find((t) => t.id === tab);
  if (foundTab) {
    return foundTab.content;
  }
  return () => null;
};
