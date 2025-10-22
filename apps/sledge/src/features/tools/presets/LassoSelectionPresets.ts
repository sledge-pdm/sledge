import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { PresetFieldMeta, ToolPresetMeta } from './PresetMeta';

export const lassoSelectionPresets: PresetFieldMeta[] = [];

export const lassoSelectionPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.LASSO_SELECTION,
  fields: lassoSelectionPresets,
};
