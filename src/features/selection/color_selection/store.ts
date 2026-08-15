import { createStore } from 'solid-js/store';
import type { ColorSelectionSource, ColorSelectionState } from './types';

export const createDefaultColorSelectionState = (): ColorSelectionState => ({
  isOpen: false,
  isPicking: false,
  target: 'layer',
  mode: 'replace',
  threshold: 0,
  targetColor: [0, 0, 0, 255],
  restoreToolId: undefined,
});

export const [colorSelectionStore, setColorSelectionStore] = createStore<ColorSelectionState>(createDefaultColorSelectionState());

let pickSourceSnapshot: ColorSelectionSource | undefined;

export const getColorSelectionPickSource = () => pickSourceSnapshot;

export const setColorSelectionPickSource = (source?: ColorSelectionSource) => {
  pickSourceSnapshot = source;
};
