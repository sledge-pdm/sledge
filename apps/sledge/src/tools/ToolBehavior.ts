import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { RGBAColor } from '~/utils/ColorUtils';

export interface ToolResult {
  shouldUpdate: boolean;
  shouldRegisterToHistory: boolean;
}

export interface ToolBehavior {
  onlyOnCanvas?: boolean;

  onStart: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;

  onMove: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;

  onEnd: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;
}

export interface ToolArgs {
  position: Vec2;
  lastPosition?: Vec2;
  color: RGBAColor; // RGBA
  presetName?: string;
  event?: PointerEvent;
  // TODO: pressure, tilt, ...
}
