import { saveEditorState } from '~/features/io/editor/save';
import { activeLayer } from '~/features/layer';
import { PresetConfig, ToolCategory, ToolCategoryId } from '~/features/tools/Tools';
import { setToolStore, toolStore } from '~/stores/EditorStores';

export const getToolCategory = (id: ToolCategoryId): ToolCategory => toolStore.tools[id];

export const getActiveToolCategory = (): ToolCategory => getToolCategory(toolStore.activeToolCategory);

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

export function getSelectedPresetName(id: ToolCategoryId): string | undefined {
  const presets = getToolCategory(id).presets;
  return presets?.selected;
}

export function getCurrentToolPreset(): PresetConfig | undefined {
  return getSelectedPreset(getActiveToolCategory());
}

export function getActiveToolCategoryId(): ToolCategoryId {
  return toolStore.activeToolCategory;
}
export function getPrevActiveToolCategoryId(): ToolCategoryId | undefined {
  return toolStore.prevActiveCategory;
}

export function setActiveToolCategory(toolCategory: ToolCategoryId) {
  if (toolStore.activeToolCategory === toolCategory) return;
  console.log(`tool changed ${toolStore.activeToolCategory} -> ${toolCategory}`);
  setToolStore('prevActiveCategory', toolStore.activeToolCategory);
  setToolStore('activeToolCategory', toolCategory);
}

export const updateToolPresetConfig = (toolId: ToolCategoryId, presetName: string, key: string, value: any) => {
  setToolStore('tools', toolId, 'presets', 'options', presetName, key, value);

  saveEditorState();
};

export const setActiveToolPreset = (toolId: ToolCategoryId, presetName: string) => {
  setToolStore('tools', toolId, 'presets', 'selected', presetName);
};

export const getCurrentPresetConfig = (toolId: ToolCategoryId): Record<string, any> | undefined => {
  const tool = toolStore.tools[toolId];
  if (!tool?.presets) return undefined;

  const selectedPreset = tool.presets.selected;
  return tool.presets.options[selectedPreset];
};

export function isToolAllowedInCurrentLayer(category?: ToolCategory): boolean {
  // return true when it's accepted in tool behavior
  // if (category.behavior.acceptInactiveLayer) return true;

  // otherwise it's up to whether the layer is enabled
  return activeLayer().enabled;
}
