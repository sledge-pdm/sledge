import { Theme } from '@sledge/theme';
import { CanvasRenderingMode } from '~/features/canvas';
import { CanvasCenteringMode } from '~/features/canvas/model';
import { Cursor } from '~/features/config/models/types/Cursor';
import { FPS } from '~/features/config/models/types/FPS';

export type GlobalConfig = {
  general: {
    theme: Theme;
    skippedVersions: string[];
    resetSkippedVersions: string;
  };
  default: {
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
  },
  performance: {
    canvasRenderingMode: 'adaptive',
    targetFPS: '60',
  },
  debug: {
    showPerformanceMonitor: false,
  },
};
