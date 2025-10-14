import { Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';

type DebugPoint = Vec2 & {
  color: RGBAColor;
};

export type BottomBarKind = 'info' | 'warn' | 'error';

export type LogStore = {
  bottomBarText: string;
  bottomBarKind: BottomBarKind;
  canvasDebugPoints: DebugPoint[]; // デバッグ用の点の配列
};

export const defaultLogStore: LogStore = {
  bottomBarText: 'rotate: shift+wheel / drag: ctrl+drag',
  bottomBarKind: 'info',
  canvasDebugPoints: [],
};
