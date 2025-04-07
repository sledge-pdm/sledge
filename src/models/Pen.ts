import { v4 as uuidv4 } from "uuid";
import { penStore, setPenStore } from "~/stores/Store";

export type Pen = {
  id: string;
  name: string;
  size: number;
  color: string;
};

export const createPen = (name: string, size: number, color: string): Pen => ({
  id: uuidv4(),
  name,
  size,
  color,
});

export const setCurrentPenColor = (colorHexString: string) => {
  return setPenStore("pens", penStore.usingIndex, "color", colorHexString);
};
