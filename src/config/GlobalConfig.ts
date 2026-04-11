import { Theme } from '@sledge-pdm/ui';
import { KeyConfigStore, makeDefaultKeyConfigStore } from '~/config/KeyConfig';
import { Cursor } from '~/config/types/Cursor';
import { FPS } from '~/config/types/FPS';
import { CanvasRenderingMode } from '~/features/canvas';
import { CanvasCenteringMode } from '~/features/canvas/model';

export const maxLayerCountConfig = {
  min: 1,
  max: 128,
  defaultValue: 64,
} as const;

export const normalizeMaxLayerCount = (value: number) => {
  if (!Number.isFinite(value)) return maxLayerCountConfig.defaultValue;
  return Math.min(maxLayerCountConfig.max, Math.max(maxLayerCountConfig.min, Math.trunc(value)));
};

export type GlobalConfig = {
  general: {
    theme: Theme;
    skippedVersions: string[];
  };
  default: {
    open: 'new' | 'last';
    canvasSize: { width: number; height: number };
  };
  editor: {
    cursor: Cursor;
    rotateDegreePerWheelScroll: number;
    showPointedPixel: boolean;
    centerCanvasOnResize: CanvasCenteringMode;
    centerCanvasOnMaximize: CanvasCenteringMode;
    requireConfirmBeforeLayerRemove: boolean;
    requireConfirmBeforeLayerClear: boolean;
    maxHistoryItemsCount: number;
    maxLayerCount: number;
    touchRotationZeroSnapThreshold: number;
    rulerMarkDirection: 'outward' | 'inward';
    useRawMove: boolean;
  };
  performance: {
    targetFPS: FPS;
    canvasRenderingMode: CanvasRenderingMode;
  };
  debug: {
    showPerformanceMonitor: boolean;
    showDirtyTiles: boolean;
    updateChannel: string;
  };
  keyConfig: KeyConfigStore;
};

export const makeDefaultGlobalConfig = (): GlobalConfig => ({
  general: {
    theme: 'os',
    skippedVersions: [],
  },
  default: {
    open: 'last',
    canvasSize: { width: 1024, height: 1024 },
  },
  editor: {
    cursor: 'cross',
    rotateDegreePerWheelScroll: 1,
    centerCanvasOnResize: 'disabled',
    centerCanvasOnMaximize: 'offset',
    requireConfirmBeforeLayerRemove: true,
    requireConfirmBeforeLayerClear: true,
    showPointedPixel: true,
    maxHistoryItemsCount: 50,
    maxLayerCount: maxLayerCountConfig.defaultValue,
    touchRotationZeroSnapThreshold: 5,
    rulerMarkDirection: 'inward',
    useRawMove: false,
  },
  performance: {
    canvasRenderingMode: 'adaptive',
    targetFPS: '60',
  },
  debug: {
    showPerformanceMonitor: false,
    showDirtyTiles: false,
    updateChannel: 'stable',
  },
  keyConfig: makeDefaultKeyConfigStore(),
});

// Keep a default instance for places that expect a value, but prefer calling makeDefaultGlobalConfig for freshness.
export const defaultConfig: GlobalConfig = makeDefaultGlobalConfig();
