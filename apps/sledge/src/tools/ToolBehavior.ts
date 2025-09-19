import { Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';
// NOTE: 移行中: 旧 LayerImageAgent を直接受け取っていたインターフェースを AnvilAdapter API に抽象化
import { fillRect, getPixel, setPixel } from '~/features/layer/anvil/AnvilController';

export interface AnvilToolContext {
  layerId: string;
  setPixel: (x: number, y: number, rgba: [number, number, number, number]) => void;
  getPixel: (x: number, y: number) => [number, number, number, number] | undefined;
  fillRect: (x: number, y: number, w: number, h: number, rgba: [number, number, number, number]) => void;
}

export function createAnvilToolContext(layerId: string): AnvilToolContext {
  return {
    layerId,
    setPixel: (x, y, c) => {
      try {
        setPixel(layerId, x, y, c);
      } catch (e) {
        // console.log(e);
      }
    },
    getPixel: (x, y) => {
      try {
        return getPixel(layerId, x, y);
      } catch (e) {
        // console.log(e);
      }
    },
    fillRect: (x, y, w, h, c) => fillRect(layerId, x, y, w, h, c),
  };
}

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

  onStart: (ctx: AnvilToolContext, args: ToolArgs) => ToolResult;

  onMove: (ctx: AnvilToolContext, args: ToolArgs) => ToolResult;

  onEnd: (ctx: AnvilToolContext, args: ToolArgs) => ToolResult;

  onCancel?: (ctx: AnvilToolContext, args: ToolArgs) => ToolResult;
}

export interface ToolArgs {
  layerId: string;
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
