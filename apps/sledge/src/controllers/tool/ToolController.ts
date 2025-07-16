import { setToolStore, toolStore } from '~/stores/EditorStores';
import { PresetConfig, ToolCategory, ToolCategoryId } from '~/tools/Tools';

export const getToolCategory = (id: ToolCategoryId): ToolCategory => toolStore.tools[id];

export const getCurrentToolCategory = (): ToolCategory => getToolCategory(toolStore.activeToolCategory);

export function getPresetOf(id: ToolCategoryId, presetName: string): PresetConfig | undefined;
export function getPresetOf(category: ToolCategory, presetName: string): PresetConfig | undefined;
export function getPresetOf(arg: ToolCategoryId | ToolCategory, presetName: string): PresetConfig | undefined {
  if (typeof arg === 'string') {
    return getToolCategory(arg).presets?.options[presetName];
  }
  return arg.presets?.options[presetName];
}

export function getSelectedPreset(category: ToolCategory): PresetConfig | undefined {
  const presets = category.presets;
  if (!presets || !presets.selected || !presets.options) {
    return undefined;
  }
  const preset = presets.options[presets.selected];
  return preset;
}

export function getCurrentToolPreset(): PresetConfig | undefined {
  return getSelectedPreset(getCurrentToolCategory());
}

export function getActiveToolCategory(): ToolCategoryId {
  return toolStore.activeToolCategory;
}
export function getPrevActiveToolCategory(): ToolCategoryId | undefined {
  return toolStore.prevActiveCategory;
}

export function setActiveToolCategory(toolCategory: ToolCategoryId) {
  setToolStore('prevActiveCategory', toolStore.activeToolCategory);
  setToolStore('activeToolCategory', toolCategory);
}

export function setToolSize(categoryId: ToolCategoryId, presetName: string, size: number) {
  setToolStore('tools', categoryId, 'presets', 'options', presetName, 'size', size);
}
