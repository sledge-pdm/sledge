import SizeHistoryRow from '~/components/section/editor/tool/SizeHistoryRow';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const eraserPresetFields: PresetFieldMeta[] = [
  {
    key: 'size',
    label: 'Size',
    component: 'Slider',
    props: {
      labelWidth: 48,
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
    component: 'Custom',
    props: {
      content: () => {
        return <SizeHistoryRow categoryId={TOOL_CATEGORIES.ERASER} />;
      },
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
