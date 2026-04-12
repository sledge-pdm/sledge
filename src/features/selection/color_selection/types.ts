import type { RGBA } from '@sledge-pdm/core';
import type { ToolCategoryId } from '~/features/tools/Tools';

export type ColorSelectionTarget = 'layer' | 'canvas';
export type ColorSelectionMode = 'replace' | 'add' | 'subtract';

export interface ColorSelectionSource {
  target: ColorSelectionTarget;
  width: number;
  height: number;
  buffer: Uint8ClampedArray;
}

export interface ColorSelectionState {
  isOpen: boolean;
  isPicking: boolean;
  target: ColorSelectionTarget;
  mode: ColorSelectionMode;
  threshold: number;
  targetColor: RGBA;
  restoreToolId?: ToolCategoryId;
}
