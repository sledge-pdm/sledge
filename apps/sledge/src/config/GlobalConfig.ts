import { Theme } from '@sledge/theme';
import { KeyConfigStore, makeDefaultKeyConfigStore } from '~/config/KeyConfig';
import { Cursor } from '~/config/types/Cursor';
import { FPS } from '~/config/types/FPS';
import { CanvasRenderingMode } from '~/features/canvas';
import { CanvasCenteringMode } from '~/features/canvas/model';

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
    touchRotationZeroSnapThreshold: number;
    rulerMarkDirection: 'outward' | 'inward';
  };
  performance: {
    targetFPS: FPS;
    canvasRenderingMode: CanvasRenderingMode;
  };
  debug: {
    showPerformanceMonitor: boolean;
    showDirtyTiles: boolean;
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
    touchRotationZeroSnapThreshold: 5,
    rulerMarkDirection: 'inward',
  },
  performance: {
    canvasRenderingMode: 'adaptive',
    targetFPS: '60',
  },
  debug: {
    showPerformanceMonitor: false,
    showDirtyTiles: false,
  },
  keyConfig: makeDefaultKeyConfigStore(),
});

// Keep a default instance for places that expect a value, but prefer calling makeDefaultGlobalConfig for freshness.
export const defaultConfig: GlobalConfig = makeDefaultGlobalConfig();
