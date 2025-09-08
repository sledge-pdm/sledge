import { Vec2 } from '@sledge/core';
import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import { RGBAColor } from '~/features/color';

export interface ToolResult {
  result?: string;
  shouldUpdate: boolean;
  shouldRegisterToHistory: boolean;
  shouldReturnToPrevTool?: boolean;
}

export interface ToolBehavior {
  acceptStartOnOutCanvas?: boolean;
  onlyOnCanvas?: boolean;
  isInstantTool?: boolean;

  onStart: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;

  onMove: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;

  onEnd: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;

  onCancel?: (agent: LayerImageAgent, args: ToolArgs) => ToolResult;
}

export interface ToolArgs {
  // pixel position (not rounded)
  rawPosition: Vec2;
  rawLastPosition?: Vec2;
  // pixel position (rounded)
  position: Vec2;
  lastPosition?: Vec2;
  color: RGBAColor; // RGBA
  presetName?: string;
  event?: PointerEvent;
  // TODO: pressure, tilt, ...
}
