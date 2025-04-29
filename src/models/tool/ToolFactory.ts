import { v4 } from 'uuid';
import { Tool, ToolType } from '~/types/Tool';

export const createTool = (type: ToolType, name: string, size: number): Tool => ({
  id: v4(),
  type,
  name,
  size,
});
