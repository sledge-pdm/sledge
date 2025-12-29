import { RGBA } from '@sledge-pdm/anvil';
import { Vec2 } from '@sledge-pdm/core';

export interface ToolResult {
  shouldUpdate: boolean;
  shouldRegisterToHistory: boolean;
  shouldReturnToPrevTool?: boolean;
}

export interface ToolBehavior {
  allowRightClick?: boolean;
  isInstantTool?: boolean;

  onStart: (args: ToolArgs) => ToolResult;
  onMove: (args: ToolArgs) => ToolResult;
  onRawMove?: (args: ToolArgs) => ToolResult;
  onEnd: (args: ToolArgs) => ToolResult;
  onCancel?: (args: ToolArgs) => ToolResult;
}

export interface ToolArgs {
  layerId: string;
  // pixel position (not rounded)
  rawPosition: Vec2;
  // pixel position (rounded)
  position: Vec2;
  color: RGBA; // RGBA
  presetName?: string;
  event?: PointerEvent;
  // TODO: pressure, tilt, ...
}
