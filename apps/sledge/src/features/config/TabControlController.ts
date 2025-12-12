// move "set tab" or "toggle tab" or "call this tab" in here from everywhere foreafter

import { SECTION_TAB_CONTROLS, SectionTabControlDefinition, type SectionSide, type SectionTabControl } from '~/config/SectionTabConfig';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';

export const getTabControl = (tab: SectionTabControl): SectionTabControlDefinition | undefined =>
  SECTION_TAB_CONTROLS.find((control) => tab === control.id);

export const getTabControlSide = (tab: SectionTabControl): SectionSide | undefined => {
  if (appearanceStore.leftSide.controls.includes(tab)) return 'leftSide';
  if (appearanceStore.rightSide.controls.includes(tab)) return 'rightSide';
  return undefined;
};

const clampIndex = (idx: number, length: number) => Math.min(Math.max(idx, 0), Math.max(length, 1) - 1);

export const moveTabControl = (tab: SectionTabControl, targetSide: SectionSide, targetIndex?: number) => {
  const sourceSide = getTabControlSide(tab);
  if (!sourceSide) return;

  const currentLeft = appearanceStore.leftSide.controls.filter((t) => t !== tab);
  const currentRight = appearanceStore.rightSide.controls.filter((t) => t !== tab);

  const sourceTabs = sourceSide === 'leftSide' ? currentLeft : currentRight;
  const targetTabs = targetSide === 'leftSide' ? currentLeft : currentRight;

  const insertIndex = clampIndex(targetIndex ?? targetTabs.length, targetTabs.length + 1);
  const nextTargetTabs = [...targetTabs.slice(0, insertIndex), tab, ...targetTabs.slice(insertIndex)];

  setAppearanceStore('leftSide', 'controls', targetSide === 'leftSide' ? nextTargetTabs : sourceTabs);
  setAppearanceStore('rightSide', 'controls', targetSide === 'rightSide' ? nextTargetTabs : sourceTabs);

  if (sourceSide !== targetSide && appearanceStore[sourceSide].content === tab) {
    setAppearanceStore(sourceSide, 'content', undefined);
    setAppearanceStore(targetSide, 'content', tab);
  } else if (targetSide === sourceSide && appearanceStore[sourceSide].content) {
    const nextSelection = nextTargetTabs.includes(appearanceStore[sourceSide].content as any)
      ? appearanceStore[sourceSide].content
      : nextTargetTabs[0];
    setAppearanceStore(sourceSide, 'content', nextSelection);
  }
};
