import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { MoveTool } from '~/tools/move/MoveTool';
import { RectSelection } from '~/tools/selection/rect/RectSelection';
import { RGBAColor } from '~/utils/ColorUtils';
import { ToolType } from '../models/tool/Tool';
import { Vec2 } from '../types/Vector';
import { EraserTool } from './eraser/EraserTool';
import { FillTool } from './fill/FillTool';
import { PenTool } from './pen/PenTool';

export interface ToolBehavior {
  onStart: (agent: LayerImageAgent, args: ToolArgs) => boolean;

  onMove: (agent: LayerImageAgent, args: ToolArgs) => boolean;

  onEnd: (agent: LayerImageAgent, args: ToolArgs) => boolean;
}

export interface ToolArgs {
  position: Vec2;
  lastPosition?: Vec2;
  color: RGBAColor; // RGBA
  size?: number;
  event?: PointerEvent;
  // TODO: pressure, tilt, ...
}

export const getToolInstance = (toolType: ToolType) => {
  switch (toolType) {
    case ToolType.Pen:
      return new PenTool();
    case ToolType.Eraser:
      return new EraserTool();
    case ToolType.Fill:
      return new FillTool();
    case ToolType.RectSelection:
      return new RectSelection();
    case ToolType.Move:
      return new MoveTool();

    default:
      return new PenTool();
  }
};
