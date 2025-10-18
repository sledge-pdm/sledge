import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export type LassoDisplayMode = 'fill' | 'outline' | 'trail';

export const lassoSelectionPresets: PresetFieldMeta[] = [
  {
    key: 'displayMode',
    label: 'Display',
    component: 'Dropdown',
    props: {
      options: [
        // { label: 'Fill', value: 'fill' },
        { label: 'Outline', value: 'outline' },
        { label: 'Trail', value: 'trail' },
      ],
    },
    tips: 'Choose how the lasso selection is displayed while drawing',
  },
];

export const lassoSelectionPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.LASSO_SELECTION,
  fields: lassoSelectionPresets,
};
