import { setToolStore, toolStore } from "~/stores/internal/toolsStore";

export enum ToolType {
  Pen = "pen",
  Eraser = "eraser",
  Fill = "fill",
}

export type Tool = {
  type: ToolType;
  id: string;
  name: string;
  size: number;
  color: string;
};

export const setCurrentToolColor = (colorHexString: string) => {
  return setToolStore("tools", toolStore.usingIndex, "color", colorHexString);
};
