import { PresetFieldMeta } from '~/features/tools/presets/PresetMeta';
import SelectionModeField from '~/features/tools/presets/SelectionModeField';

export const selectModeMeta: PresetFieldMeta = {
  key: 'selection_mode',
  label: 'Mode',
  component: SelectionModeField,
  tips: 'Color tolerance for fill operation',
};
