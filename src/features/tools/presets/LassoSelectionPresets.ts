import { selectModeMeta } from '~/features/tools/presets/SelectionMeta';
import { LassoSelectionPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const lassoSelectionPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.LASSO_SELECTION,
  fields: [
    selectModeMeta,
    {
      key: 'fillMode',
      label: 'fill mode',
      component: 'Dropdown',
      props: {
        options: [
          { value: 'nonzero', label: 'nonzero' },
          { value: 'evenodd', label: 'evenodd' },
        ],
      },
      tips: 'lasso fill mode.',
    },
  ] satisfies PresetFieldMeta<LassoSelectionPresetConfig>[],
};
