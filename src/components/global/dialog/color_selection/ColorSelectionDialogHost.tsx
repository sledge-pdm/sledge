import { Component, Show } from 'solid-js';
import { colorSelectionStore } from '~/features/selection/color_selection';
import ColorSelectionDialog from './ColorSelectionDialog';

const ColorSelectionDialogHost: Component = () => {
  return <Show when={colorSelectionStore.isOpen}>{<ColorSelectionDialog />}</Show>;
};

export default ColorSelectionDialogHost;
