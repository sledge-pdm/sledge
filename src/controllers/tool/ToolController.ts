import { setToolStore, toolStore } from '~/stores/EditorStores';
import { ToolType } from '~/types/Tool';

export const currentTool = () => toolStore.tools[toolStore.usingIndex];

export function switchToolType(type: ToolType) {
  const indexToSwitch = toolStore.tools.findIndex((tool) => tool.type === type);
  switchTool(indexToSwitch);
}

export function switchTool(index: number) {
  setToolStore('usingIndex', index);
}
