import { setToolStore, toolStore } from '~/stores/EditorStores';
import { defaultTools, ToolType } from '~/tools/Tools';

export const getCurrentTool = () => toolStore.tools[toolStore.activeType] ?? defaultTools['pen'];

export function getActiveToolType(): ToolType {
  return toolStore.activeType;
}
export function getPrevActiveToolType(): ToolType | undefined {
  return toolStore.prevActiveType;
}

export function setActiveToolType(toolType: ToolType) {
  setToolStore('prevActiveType', toolStore.activeType);
  setToolStore('activeType', toolType);
}

export function setToolSize(toolType: ToolType, size: number) {
  setToolStore('tools', toolType, 'size', size);
}
