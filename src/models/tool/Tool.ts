export enum ToolType {
  Pen = 'pen',
  Eraser = 'eraser',
  Fill = 'fill',
}

export type Tool = {
  type: ToolType;
  id: string;
  name: string;
  size: number;
};
