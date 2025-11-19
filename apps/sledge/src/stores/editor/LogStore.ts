import { RGBA } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';

type DebugPoint = Vec2 & {
  color: RGBA;
};

export type LogKind = 'persistent' | 'info' | 'success' | 'warn' | 'error';

export type LogStore = {
  bottomBarText: string;
  bottomBarKind: LogKind;
  canvasDebugPoints: DebugPoint[]; // デバッグ用の点の配列
};

export const defaultLogStore: LogStore = {
  bottomBarText: 'rotate: shift+wheel / drag: ctrl+drag',
  bottomBarKind: 'persistent',
  canvasDebugPoints: [],
};
