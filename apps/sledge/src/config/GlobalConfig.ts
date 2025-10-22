import { Theme } from '@sledge/theme';
import { Cursor } from '~/config/types/Cursor';
import { FPS } from '~/config/types/FPS';
import { CanvasRenderingMode } from '~/features/canvas';
import { CanvasCenteringMode } from '~/features/canvas/model';

export type GlobalConfig = {
  general: {
    theme: Theme;
    skippedVersions: string[];
    resetSkippedVersions: string;
  };
  default: {
    open: 'new' | 'last';
    addOnlySavedProjectToLastOpened: boolean;
    canvasSize: { width: number; height: number };
  };
  editor: {
    cursor: Cursor;
    rotateDegreePerWheelScroll: number;
    showPointedPixel: boolean;
    centerCanvasOnResize: CanvasCenteringMode;
    centerCanvasOnMaximize: CanvasCenteringMode;
    requireConfirmBeforeLayerRemove: boolean;
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
  };
};

export const defaultConfig: GlobalConfig = {
  general: {
    theme: 'os',
    skippedVersions: [],
    resetSkippedVersions: '',
  },
  default: {
    open: 'last',
    addOnlySavedProjectToLastOpened: false,
    canvasSize: { width: 1024, height: 1024 },
  },
  editor: {
    cursor: 'cross',
    rotateDegreePerWheelScroll: 1,
    centerCanvasOnResize: 'disabled',
    centerCanvasOnMaximize: 'offset',
    requireConfirmBeforeLayerRemove: true,
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
  },
};
