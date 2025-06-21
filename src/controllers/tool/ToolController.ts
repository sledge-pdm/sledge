import { setToolStore, toolStore } from '~/stores/EditorStores';
import { defaultTools, Tool, ToolType } from '~/tools/Tools';

export const getCurrentTool = () => toolStore.tools[toolStore.activeType] ?? defaultTools['pen'];

export function setActiveToolType(toolType: ToolType) {
  setToolStore('activeType', toolType);
}

export function setToolSize(toolType: ToolType, size: number) {
  setToolStore('tools', toolType, 'size', size);
}
