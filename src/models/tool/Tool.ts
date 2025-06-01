import { ToolBehavior } from '~/tools/ToolBase';

export enum ToolType {
  Pen = 'pen',
  Eraser = 'eraser',
  Fill = 'fill',
  RectSelection = 'rectSelection',
  Move = 'move',
}

export type Tool = {
  type: ToolType;
  id: string;
  name: string;
  size: number;

  behavior: ToolBehavior;
};
