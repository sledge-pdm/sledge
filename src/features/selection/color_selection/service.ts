import type { RGBA } from '@sledge-pdm/core';
import { currentColor } from '~/features/color';
import { doCommands } from '~/features/history';
import { ApplySelectionFrontToBackCommand } from '~/features/history/commands';
import { logUserInfo, logUserWarn } from '~/features/log/service';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/features/tools/ToolController';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { hasMaskPixels, mergeSelectionMasks, readColorFromBuffer, selectColorRangeMask } from './mask';
import { buildColorSelectionSource } from './source';
import {
  colorSelectionStore,
  createDefaultColorSelectionState,
  getColorSelectionPickSource,
  setColorSelectionPickSource,
  setColorSelectionStore,
} from './store';
import type { ColorSelectionMode, ColorSelectionTarget } from './types';

const cloneColor = (color: RGBA): RGBA => [color[0], color[1], color[2], color[3]];

const clearPickingState = () => {
  setColorSelectionStore('isPicking', false);
  setColorSelectionStore('restoreToolId', undefined);
  setColorSelectionPickSource(undefined);
};

const refreshPickSource = () => {
  if (!colorSelectionStore.isPicking) return;
  setColorSelectionPickSource(buildColorSelectionSource(colorSelectionStore.target));
};

export function openColorSelectionDialog() {
  if (colorSelectionStore.isOpen) return;
  resetColorSelectionState();
  setColorSelectionStore('isOpen', true);
  setColorSelectionStore('targetColor', cloneColor(currentColor()));
}

export function closeColorSelectionDialog() {
  cancelColorSelectionPick();
  setColorSelectionStore('isOpen', false);
}

export function setColorSelectionTarget(target: ColorSelectionTarget) {
  setColorSelectionStore('target', target);
  refreshPickSource();
}

export function setColorSelectionMode(mode: ColorSelectionMode) {
  setColorSelectionStore('mode', mode);
}

export function setColorSelectionThreshold(threshold: number) {
  setColorSelectionStore('threshold', Math.max(0, Math.min(255, Math.round(threshold))));
}

export function setColorSelectionTargetColor(color: RGBA) {
  setColorSelectionStore('targetColor', cloneColor(color));
}

export function getColorSelectionTargetColor(): RGBA {
  return cloneColor(colorSelectionStore.targetColor);
}

export function isColorSelectionPicking(): boolean {
  return colorSelectionStore.isPicking;
}

export function shouldRestoreToolAfterColorSelectionPick(): boolean {
  return !!colorSelectionStore.restoreToolId;
}

export function getColorSelectionPreviewColor(x: number, y: number): RGBA | undefined {
  if (!colorSelectionStore.isPicking) return undefined;
  const source = getColorSelectionPickSource();
  if (!source) return undefined;
  return readColorFromBuffer(source.buffer, source.width, source.height, x, y);
}

export function startColorSelectionPick() {
  const source = buildColorSelectionSource(colorSelectionStore.target);
  if (!source) {
    logUserWarn('Failed to start color selection pipette.');
    return false;
  }

  const activeToolId = getActiveToolCategoryId();
  setColorSelectionStore('isPicking', true);
  setColorSelectionStore('restoreToolId', activeToolId === TOOL_CATEGORIES.PIPETTE ? undefined : activeToolId);
  setColorSelectionPickSource(source);

  if (activeToolId !== TOOL_CATEGORIES.PIPETTE) {
    setActiveToolCategory(TOOL_CATEGORIES.PIPETTE);
  }

  return true;
}

export function completeColorSelectionPick(sampledColor?: RGBA, options?: { keepPicking?: boolean }) {
  if (sampledColor) {
    setColorSelectionTargetColor(sampledColor);
  }

  if (options?.keepPicking) {
    refreshPickSource();
    return;
  }

  clearPickingState();
}

export function cancelColorSelectionPick() {
  const restoreToolId = colorSelectionStore.restoreToolId;
  clearPickingState();

  if (restoreToolId && getActiveToolCategoryId() === TOOL_CATEGORIES.PIPETTE) {
    setActiveToolCategory(restoreToolId);
  }
}

export function applyColorSelection() {
  const source = getColorSelectionPickSource() ?? buildColorSelectionSource(colorSelectionStore.target);
  if (!source) {
    logUserWarn('Failed to build color selection source.');
    return false;
  }

  const mask = selectColorRangeMask(source.buffer, source.width, source.height, colorSelectionStore.targetColor, colorSelectionStore.threshold);
  const currentSelection = selectionManager.getBack();
  const baseMask =
    currentSelection && currentSelection.getWidth() === source.width && currentSelection.getHeight() === source.height
      ? currentSelection.getMask()
      : undefined;
  const mergedMask = mergeSelectionMasks(baseMask, mask, colorSelectionStore.mode);
  const hasPixels = hasMaskPixels(mergedMask);
  const selection = hasPixels ? new SelectionMask(source.width, source.height, mergedMask) : undefined;

  doCommands(
    new ApplySelectionFrontToBackCommand({
      swapBack: selection,
    })
  );

  if (hasPixels) {
    logUserInfo('Color selection applied.');
  } else {
    logUserInfo('Color selection cleared.');
  }

  return hasPixels;
}

export function resetColorSelectionState() {
  const defaults = createDefaultColorSelectionState();
  setColorSelectionStore('isOpen', defaults.isOpen);
  setColorSelectionStore('isPicking', defaults.isPicking);
  setColorSelectionStore('target', defaults.target);
  setColorSelectionStore('mode', defaults.mode);
  setColorSelectionStore('threshold', defaults.threshold);
  setColorSelectionStore('targetColor', cloneColor(currentColor()));
  setColorSelectionStore('restoreToolId', defaults.restoreToolId);
  setColorSelectionPickSource(undefined);
}

export function syncColorSelectionColorToCurrentColor() {
  setColorSelectionTargetColor(currentColor());
}
