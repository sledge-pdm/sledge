import { v4 as uuidv4 } from "uuid";
import { Pen } from "../types/Pen";

export const createPen = (name: string, size: number, color: string): Pen => ({
  id: uuidv4(),
  name,
  size,
  color,
});
