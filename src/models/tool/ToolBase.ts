import LayerImageAgent from '~/controllers/layer/LayerImageAgent';
import { RGBAColor } from '~/utils/ColorUtils';
import { EraserTool } from '../../controllers/tool/eraser/EraserTool';
import { FillTool } from '../../controllers/tool/fill/FillTool';
import { PenTool } from '../../controllers/tool/pen/PenTool';
import { Vec2 } from '../../types/Vector';
import { ToolType } from './Tool';

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
