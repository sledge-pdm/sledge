import { v4 as uuidv4 } from "uuid";
import { Tool, ToolType } from "../types/Tool";

export const createTool = (
  type: ToolType,
  name: string,
  size: number,
): Tool => ({
  id: uuidv4(),
  type,
  name,
  size,
});
