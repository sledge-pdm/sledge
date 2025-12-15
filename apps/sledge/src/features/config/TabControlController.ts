import { SECTION_TAB_CONTROLS, SectionTabControlDefinition, type SectionSide, type SectionTabControl } from '~/config/SectionTabConfig';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';

export const getTabControl = (control: SectionTabControl): SectionTabControlDefinition | undefined =>
  SECTION_TAB_CONTROLS.find((c) => control === c.id);

export const getTabControlSide = (control: SectionTabControl): SectionSide | undefined => {
  if (appearanceStore.leftSide.controls.includes(control)) return 'leftSide';
  if (appearanceStore.rightSide.controls.includes(control)) return 'rightSide';
  return undefined;
};

const clampIndex = (idx: number, length: number) => Math.min(Math.max(idx, 0), Math.max(length, 1) - 1);

export const moveTabControl = (control: SectionTabControl, targetSide: SectionSide, targetIndex?: number) => {
  const sourceSide = getTabControlSide(control);
  if (!sourceSide) return;

  const currentLeft = appearanceStore.leftSide.controls;
  const currentRight = appearanceStore.rightSide.controls;
  const filteredLeft = currentLeft.filter((c) => c !== control);
  const filteredRight = currentRight.filter((c) => c !== control);

  const sourceTabs = sourceSide === 'leftSide' ? filteredLeft : filteredRight;
  const targetTabs = targetSide === 'leftSide' ? filteredLeft : filteredRight;

  const insertIndex = clampIndex(targetIndex ?? targetTabs.length, targetTabs.length + 1);
  const nextTargetTabs = [...targetTabs.slice(0, insertIndex), control, ...targetTabs.slice(insertIndex)];

  // Safety: ensure control is only present in the target side even if callers misbehave.
  const dedupedLeft = targetSide === 'leftSide' ? nextTargetTabs : filteredLeft.filter((c) => c !== control);
  const dedupedRight = targetSide === 'rightSide' ? nextTargetTabs : filteredRight.filter((c) => c !== control);

  setAppearanceStore('leftSide', 'controls', dedupedLeft);
  setAppearanceStore('rightSide', 'controls', dedupedRight);
  setAppearanceStore(sourceSide, 'controlsVisibility', (vis) => {
    const next = { ...(vis ?? {}) };
    delete next[control];
    return next;
  });
  setAppearanceStore(targetSide, 'controlsVisibility', (vis) => ({
    ...(vis ?? {}),
    [control]: appearanceStore[targetSide].controlsVisibility?.[control] ?? true,
  }));

  if (sourceSide !== targetSide && appearanceStore[sourceSide].content === control) {
    setAppearanceStore(sourceSide, 'content', undefined);
    setAppearanceStore(targetSide, 'content', control);
  } else if (targetSide === sourceSide && appearanceStore[sourceSide].content) {
    const nextSelection = nextTargetTabs.includes(appearanceStore[sourceSide].content as any)
      ? appearanceStore[sourceSide].content
      : nextTargetTabs[0];
    setAppearanceStore(sourceSide, 'content', nextSelection);
  }

  saveEditorStateImmediate();
};

export const isTabControlVisible = (control: SectionTabControl): boolean => {
  const side = getTabControlSide(control);
  if (!side) return false;
  const visibility = appearanceStore[side].controlsVisibility?.[control];
  return visibility !== false;
};

export const toggleTabControlVisibility = (control: SectionTabControl) => {
  const definition = getTabControl(control);
  const currentSide = getTabControlSide(control);
  const targetSide = currentSide ?? definition?.defaultSide ?? 'leftSide';
  const currentlyVisible = currentSide ? isTabControlVisible(control) : false;

  if (!currentSide) {
    const currentControls = appearanceStore[targetSide].controls;
    if (!currentControls.includes(control)) {
      setAppearanceStore(targetSide, 'controls', [...currentControls, control]);
    }
  }

  setAppearanceStore(targetSide, 'controlsVisibility', (vis) => ({
    ...(vis ?? {}),
    [control]: !currentlyVisible,
  }));

  saveEditorStateImmediate();
};
