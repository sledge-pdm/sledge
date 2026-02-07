import { toolCategories, ToolCategory, ToolCategoryId } from '~/features/tools/Tools';

export type SelectionLimitMode = 'none' | 'outside' | 'inside';
export type ToolStore = {
  tools: Record<ToolCategoryId, ToolCategory>;
  activeToolCategory: ToolCategoryId;
  prevActiveCategory: ToolCategoryId | undefined;
  selectionLimitMode: SelectionLimitMode;
};

export const defaultToolStore: ToolStore = {
  tools: toolCategories,
  activeToolCategory: 'pen',
  prevActiveCategory: undefined,
  selectionLimitMode: 'inside',
};
