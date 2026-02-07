import { selectionManager } from '~/features/selection/SelectionManager';
import { FillPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const fillPresetFields: PresetFieldMeta<FillPresetConfig>[] = [
  {
    key: 'threshold',
    label: 'Threshold',
    component: 'Slider',
    props: {
      min: 0,
      max: 255,
      step: 1,
      labelWidth: 40,
      allowFloat: false,
    },
    tips: 'Color tolerance for fill operation',
  },
  {
    key: 'selectionFillMode',
    label: 'Selection Fill',
    component: 'Dropdown',
    props: {
      options: [
        { value: 'area', label: 'selection area' },
        { value: 'inside', label: 'inside selection' },
        { value: 'ignore', label: 'ignore selection' },
      ],
    },
    condition: () => selectionManager.hasSelection(),
    tips: 'Pen brush shape',
  },
  // {
  //   key: 'antialias',
  //   label: 'Antialias',
  //   component: 'ToggleSwitch',
  //   tips: 'Enable antialiasing for smoother edges',
  // },
];

export const fillPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.FILL,
  fields: fillPresetFields,
};
