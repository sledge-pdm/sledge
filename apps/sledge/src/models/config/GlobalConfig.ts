import { ConfigComponentName, FileLocation } from '@sledge/core';
import { Theme } from '@sledge/theme';
import { debugMetas } from '~/models/config/meta/Debug';
import { editorMetas } from '~/models/config/meta/Editor';
import { generalMetas } from '~/models/config/meta/General';
import { performanceMetas } from '~/models/config/meta/Performance';
import { defaultMetas } from '~/models/config/meta/ProjectDefaults';
import { Sections } from '~/models/config/Sections';
import { Cursor } from '~/models/config/types/Cursor';
import { FPS } from '~/models/config/types/FPS';
import { CanvasRenderingMode } from '../canvas/Canvas';

export type GlobalConfig = {
  misc: {
    recentFiles: FileLocation[];
  };
  appearance: {
    theme: Theme;
  };
  default: {
    canvasSize: { width: number; height: number };
  };
  editor: {
    cursor: Cursor;
    centerCanvasWhenWindowResized: boolean;
    showPointedPixel: boolean;
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
  },
  appearance: {
    theme: 'os',
  },
  default: {
    canvasSize: { width: 1000, height: 1000 },
  },
  editor: {
    cursor: 'cross',
    centerCanvasWhenWindowResized: true,
    showPointedPixel: true,
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
