import { Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';
import LayerImageAgent from '~/features/layer/agent/LayerImageAgent';

export interface ToolResult {
  result?: string;
  shouldUpdate: boolean;
  shouldRegisterToHistory: boolean;
  shouldReturnToPrevTool?: boolean;
}

export interface ToolBehavior {
  acceptStartOnOutCanvas?: boolean;
  allowRightClick?: boolean;
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
