import SizeHistoryRow from '~/components/section/editor/tool/SizeHistoryRow';
import { EraserPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const eraserPresetFields: PresetFieldMeta<EraserPresetConfig>[] = [
  {
    key: 'size',
    label: 'Size',
    component: 'Slider',
    props: {
      labelWidth: 40,
      min: 1,
      max: 100,
      step: 1,
      allowFloat: false,
    },
    tips: 'Eraser brush size',
    customFormat: (v: number) => {
      return `${v} px`;
    },
  },
  {
    key: 'sizeHistory',
    label: undefined,
    component: () => {
      return <SizeHistoryRow categoryId={TOOL_CATEGORIES.ERASER} />;
    },
  },
  {
    key: 'opacity',
    label: 'Opacity',
    component: 'Slider',
    props: {
      labelWidth: 40,
      min: 1,
      max: 100,
      step: 1,
      allowFloat: false,
    },
    tips: 'Eraser brush opacity',
    customFormat: (v: number) => {
      return `${v} %`;
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
    tips: 'Eraser brush shape',
  },
];

export const eraserPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.ERASER,
  fields: eraserPresetFields,
};
