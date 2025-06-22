import LayerImageAgent from '~/controllers/layer/image/managers/LayerImageAgent';
import { Vec2 } from '~/models/types/Vector';
import { RGBAColor } from '~/utils/ColorUtils';

export interface ToolBehavior {
  onlyOnCanvas?: boolean;

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
