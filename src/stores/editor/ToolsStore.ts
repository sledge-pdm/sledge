import { Tool } from '~/types/Tool';
import { toolStore } from '../EditorStores';

export type ToolStore = {
  usingIndex: number;
  tools: Tool[];
};

export const currentTool = () => toolStore.tools[toolStore.usingIndex];
