import { RGBA } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';

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

  onStart: (args: ToolArgs) => ToolResult;

  onMove: (args: ToolArgs) => ToolResult;

  onEnd: (args: ToolArgs) => ToolResult;

  onCancel?: (args: ToolArgs) => ToolResult;
}

export interface ToolArgs {
  layerId: string;
  // pixel position (not rounded)
  rawPosition: Vec2;
  rawLastPosition?: Vec2;
  // pixel position (rounded)
  position: Vec2;
  lastPosition?: Vec2;
  color: RGBA; // RGBA
  presetName?: string;
  event?: PointerEvent;
  // TODO: pressure, tilt, ...
}
