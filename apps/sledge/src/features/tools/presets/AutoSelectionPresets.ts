import { selectModeMeta } from '~/features/tools/presets/SelectionMeta';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const autoSelectionPresets: PresetFieldMeta[] = [
  selectModeMeta,
  {
    key: 'threshold',
    label: 'Threshold',
    component: 'Slider',
    props: {
      min: 0,
      max: 255,
      step: 1,
      allowFloat: false,
    },
    tips: 'Color tolerance for fill operation',
  },
];

export const autoSelectionPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.AUTO_SELECTION,
  fields: autoSelectionPresets,
};
