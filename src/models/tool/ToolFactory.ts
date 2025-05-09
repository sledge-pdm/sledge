import { v4 } from 'uuid';
import { Tool, ToolType } from '~/models/tool/Tool';

export const createTool = (type: ToolType, name: string, size: number): Tool => ({
  id: v4(),
  type,
  name,
  size,
});
