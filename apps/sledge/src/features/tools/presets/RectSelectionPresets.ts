import { selectModeMeta } from '~/features/tools/presets/SelectionMeta';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { ToolPresetMeta } from './PresetMeta';

export const rectSelectionPresetMeta: ToolPresetMeta = {
  toolId: TOOL_CATEGORIES.RECT_SELECTION,
  fields: [selectModeMeta],
};
