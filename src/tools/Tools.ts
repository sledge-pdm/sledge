import { EraserTool } from '~/tools/eraser/EraserTool';
import { FillTool } from '~/tools/fill/FillTool';
import { MoveTool } from '~/tools/move/MoveTool';
import { PenTool } from '~/tools/pen/PenTool';
import { PipetteTool } from '~/tools/pipette/PipetteTool';
import { RectSelection } from '~/tools/selection/rect/RectSelection';
import ToolBehavior from '~/tools/ToolBehavior';

export enum ToolType {
  Pen = 'pen',
  Eraser = 'eraser',
  Fill = 'fill',
  Pipette = 'pipette',
  RectSelection = 'rectSelection',
  Move = 'move',
}

export type Tool = {
  familiarName?: string;
  size?: number;
  iconSrc?: string;
  behavior: ToolBehavior;
};

export const defaultTools = {
  [ToolType.Pen]: {
    familiarName: 'Pen',
    size: 1,
    iconSrc: '/icons/tool/pen.png',
    behavior: new PenTool(),
  },
  [ToolType.Eraser]: {
    familiarName: 'Eraser',
    size: 1,
    iconSrc: '/icons/tool/eraser.png',
    behavior: new EraserTool(),
  },
  [ToolType.Fill]: {
    familiarName: 'Fill',
    iconSrc: '/icons/tool/fill.png',
    behavior: new FillTool(),
  },
  [ToolType.Pipette]: {
    familiarName: 'Pipette',
    iconSrc: '/icons/tool/pipette.png',
    behavior: new PipetteTool(),
  },
  [ToolType.RectSelection]: {
    familiarName: 'Rect Selection',
    iconSrc: '/icons/tool/rectselect.png',
    behavior: new RectSelection(),
  },
  [ToolType.Move]: {
    familiarName: 'Move',
    iconSrc: '/icons/tool/move.png',
    behavior: new MoveTool(),
  },
};
