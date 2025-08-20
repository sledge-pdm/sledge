import { TOOL_CATEGORIES } from '~/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const penPresetFields: PresetFieldMeta[] = [
  {
    key: 'size',
    label: 'Size',
    component: 'Slider',
    props: {
      min: 1,
      max: 20,
      step: 1,
      allowFloat: false,
    },
    tips: 'Pen brush size',
    customFormat: '[value]px',
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
  // {
  //   key: 'opacity',
  //   label: 'Opacity',
  //   component: 'Slider',
  //   props: {
  //     min: 0.1,
  //     max: 1.0,
  //     step: 0.1,
  //     allowFloat: true,
  //     floatSignificantDigits: 2,
  //   },
  //   tips: 'Pen opacity',
  //   customFormat: '[value]',
  // },
];

export const penPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.PEN,
  fields: penPresetFields,
};
