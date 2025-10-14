import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const autoSelectionPresets: PresetFieldMeta[] = [
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
  // {
  //   key: 'antialias',
  //   label: 'Antialias',
  //   component: 'ToggleSwitch',
  //   tips: 'Enable antialiasing for smoother edges',
  // },
];

export const autoSelectionPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.AUTO_SELECTION,
  fields: autoSelectionPresets,
};
