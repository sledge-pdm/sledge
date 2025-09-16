import { ConfigComponentName, FileLocation } from '@sledge/core';
import { Theme } from '@sledge/theme';
import { CanvasRenderingMode } from '~/features/canvas';
import { debugMetas } from '~/features/config/models/meta/Debug';
import { editorMetas } from '~/features/config/models/meta/Editor';
import { generalMetas } from '~/features/config/models/meta/General';
import { performanceMetas } from '~/features/config/models/meta/Performance';
import { defaultMetas } from '~/features/config/models/meta/ProjectDefaults';
import { Sections } from '~/features/config/models/Sections';
import { Cursor } from '~/features/config/models/types/Cursor';
import { FPS } from '~/features/config/models/types/FPS';

export type GlobalConfig = {
  misc: {
    recentFiles: FileLocation[];
    skippedVersions: string[];
  };
  appearance: {
    theme: Theme;
    resetSkippedVersions: string;
  };
  default: {
    canvasSize: { width: number; height: number };
  };
  editor: {
    cursor: Cursor;
    rotateDegreePerWheelScroll: number;
    showPointedPixel: boolean;
    centerCanvasOnResize: boolean;
    maxHistoryItemsCount: number;
  };
  performance: {
    canvasRenderingMode: CanvasRenderingMode;
    targetFPS: FPS;
  };
  debug: {
    showPerformanceMonitor: boolean;
    showCanvasDebugOverlay: boolean;
    showDirtyRects: boolean;
  };
};

export const defaultConfig: GlobalConfig = {
  misc: {
    recentFiles: [],
    skippedVersions: [],
  },
  appearance: {
    theme: 'os',
    resetSkippedVersions: '',
  },
  default: {
    canvasSize: { width: 1024, height: 1024 },
  },
  editor: {
    cursor: 'cross',
    rotateDegreePerWheelScroll: 1,
    centerCanvasOnResize: true,
    showPointedPixel: true,
    maxHistoryItemsCount: 50,
  },
  performance: {
    canvasRenderingMode: 'adaptive',
    targetFPS: '60',
  },
  debug: {
    showPerformanceMonitor: false,
    showCanvasDebugOverlay: false,
    showDirtyRects: false,
  },
};

export type FieldMeta = {
  section: Sections;
  path: readonly string[];
  label: string;
  component: ConfigComponentName;
  props?: Record<string, any>; // min/max/step/options など
  tips?: string;
  customFormat?: string; // format: [value] => value
};

export const settingsMeta = [
  ...generalMetas,
  ...editorMetas,
  ...performanceMetas,
  ...defaultMetas,
  ...debugMetas,
] as const satisfies readonly FieldMeta[];
