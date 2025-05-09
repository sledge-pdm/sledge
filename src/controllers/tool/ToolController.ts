import { ToolType } from '~/models/tool/Tool';
import { setToolStore, toolStore } from '~/stores/EditorStores';

export const getCurrentTool = () => toolStore.tools[toolStore.usingIndex];

export function switchToolType(type: ToolType) {
  const indexToSwitch = toolStore.tools.findIndex((tool) => tool.type === type);
  switchTool(indexToSwitch);
}

export function switchTool(index: number) {
  setToolStore('usingIndex', index);
}
