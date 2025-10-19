import { Consts } from '~/Consts';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const penPresetFields: PresetFieldMeta[] = [
  {
    key: 'size',
    label: 'Size',
    component: 'Slider',
    props: {
      min: 1,
      max: Consts.maxPenSize,
      step: 1,
      allowFloat: false,
    },
    tips: 'Pen brush size',
    customFormat: (v: number) => {
      return `${v} px`;
    },
  },
  {
    key: 'shape',
    label: 'Shape',
    component: 'Dropdown',
    props: {
      options: [
        { value: 'square', label: 'Square' },
        { value: 'circle', label: 'Circle' },
      ],
    },
    tips: 'Pen brush shape',
  },
];

export const penPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.PEN,
  fields: penPresetFields,
};
