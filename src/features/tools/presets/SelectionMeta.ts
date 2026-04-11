import { lazy } from 'solid-js';
import { PresetFieldMeta } from '~/features/tools/presets/PresetMeta';

const SelectionModeField = lazy(() => import('~/features/tools/presets/SelectionModeField'));

export const selectModeMeta: PresetFieldMeta = {
  key: 'selection_mode',
  label: 'Mode',
  component: SelectionModeField,
  tips: 'Color tolerance for fill operation',
};
