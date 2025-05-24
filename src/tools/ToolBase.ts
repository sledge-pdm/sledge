import LayerImageAgent from '~/controllers/canvas/layer/image/LayerImageAgent';
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

    default:
      return new PenTool();
  }
};
