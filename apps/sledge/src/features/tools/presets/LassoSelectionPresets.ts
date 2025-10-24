import { selectModeMeta } from '~/features/tools/presets/SelectionMeta';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { ToolPresetMeta } from './PresetMeta';

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
  ],
};
