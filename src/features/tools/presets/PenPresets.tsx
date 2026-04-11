import { lazy } from 'solid-js';
import { Consts } from '~/Consts';
import { PenPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

const SizeHistoryRow = lazy(() => import('~/components/section/editor/tool/SizeHistoryRow'));

export const penPresetFields: PresetFieldMeta<PenPresetConfig>[] = [
  {
    key: 'size',
    label: 'Size',
    component: 'Slider',
    props: {
      labelWidth: 40,
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
    key: 'sizeHistory',
    label: undefined,
    component: () => {
      return <SizeHistoryRow categoryId={TOOL_CATEGORIES.PEN} />;
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
    tips: 'Pen brush opacity',
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
    tips: 'Pen brush shape',
  },
];

export const penPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.PEN,
  fields: penPresetFields,
};
