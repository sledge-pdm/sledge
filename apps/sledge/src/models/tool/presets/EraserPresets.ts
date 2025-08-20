import { TOOL_CATEGORIES } from '~/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const eraserPresetFields: PresetFieldMeta[] = [
  {
    key: 'size',
    label: 'Size',
    component: 'Slider',
    props: {
      min: 1,
      max: 50,
      step: 1,
      allowFloat: false,
    },
    tips: 'Eraser brush size',
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
    tips: 'Eraser brush shape',
  },
  // {
  //   key: 'hardness',
  //   label: 'Hardness',
  //   component: 'Slider',
  //   props: {
  //     min: 0.0,
  //     max: 1.0,
  //     step: 0.1,
  //     allowFloat: true,
  //     floatSignificantDigits: 2,
  //   },
  //   tips: 'Eraser edge hardness',
  //   customFormat: '[value]%',
  // },
];

export const eraserPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.ERASER,
  fields: eraserPresetFields,
};
