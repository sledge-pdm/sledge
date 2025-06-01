import { v4 } from 'uuid';
import { Tool, ToolType } from '~/models/tool/Tool';
import { getToolInstance } from '~/tools/ToolBase';

export const createTool = (type: ToolType, name: string, size: number): Tool => {
  const behavior = getToolInstance(type);
  return {
    id: v4(),
    type,
    name,
    size,
    behavior,
  };
};
