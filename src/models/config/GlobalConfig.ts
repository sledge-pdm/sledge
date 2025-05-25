import { Theme } from '~/models/config/types/Theme';
import { FileLocation } from '~/types/FileLocation';
import { Consts } from '~/utils/consts';
import { CanvasRenderingMode } from '../canvas/Canvas';
import { ConfigComponentName } from './ConfigComponents';

export type GlobalConfig = {
  misc: {
    recentFiles: FileLocation[];
  };
  appearance: {
    theme: Theme;
  };
  newProject: {
    canvasSize: { width: number; height: number };
  };
  editor: {
    canvasRenderingMode: CanvasRenderingMode;
    skipMeaninglessAction: boolean;
  };
  debug: {
    showPerfMonitor: boolean;
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
  newProject: {
    canvasSize: { width: 1000, height: 1000 },
  },
  editor: {
    canvasRenderingMode: 'adaptive',
    skipMeaninglessAction: false,
  },
  debug: {
    showPerfMonitor: false,
    showDirtyRects: false,
  },
};

export enum Sections {
  General = 'GENERAL',
  Editor = 'EDITOR',
  ProjectDefaults = 'DEFAULTS',
  KeyConfig = 'KEY CONFIG',
  Debug = 'DEBUG',
}
export type FieldMeta = {
  section: Omit<Sections, 'KeyConfig'>;
  path: readonly string[];
  label: string;
  component: ConfigComponentName;
  props?: Record<string, any>; // min/max/step/options など
  tips?: string;
  customFormat?: string; // format: [value] => value
};

export const themeOptions = [
  { label: 'os theme', value: 'os' },
  { label: 'light', value: 'light' },
  { label: 'dark', value: 'dark' },
  { label: 'dark-gy-flip', value: 'dark-gy-flip' },
  { label: 'black', value: 'black' },
];

export const settingsMeta = [
  {
    section: Sections.General,
    path: ['appearance', 'theme'],
    label: 'global theme',
    component: 'Dropdown',
    props: {
      options: themeOptions,
    },
    tips: 'global theme of sledge.',
  },

  {
    section: Sections.Editor,
    path: ['editor', 'canvasRenderingMode'],
    label: 'rendering mode',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'adaptive', value: 'adaptive' },
        { label: 'pixelated', value: 'pixelated' },
        { label: 'crispEdges', value: 'crisp-edges' },
      ],
    },
    tips: `determines rendering mode of canvas.
"pixelated" shows sharp edges but misses some lines/shapes when zoomed out.
"crispEdges" is stable, but does not show edges of pixels when zoomed in.
"adaptive" will automatically changes those 2 modes (recommended).`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'skipMeaninglessAction'],
    label: 'skip meaningless action',
    component: 'ToggleSwitch',
    tips: `prevent to add change that doesn't affects image to the history.`,
  },

  {
    section: Sections.ProjectDefaults,
    path: ['newProject', 'canvasSize', 'width'],
    label: 'canvas width',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: '[value] px',
  },
  {
    section: Sections.ProjectDefaults,
    path: ['newProject', 'canvasSize', 'height'],
    label: 'canvas height',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: '[value] px',
  },

  {
    section: Sections.Debug,
    path: ['debug', 'showPerfMonitor'],
    label: 'show performance monitor',
    component: 'ToggleSwitch',
    tips: `show performance monitor.`,
  },
  {
    section: Sections.Debug,
    path: ['debug', 'showDirtyRects'],
    label: 'show dirty rects',
    component: 'ToggleSwitch',
    tips: `show dirty rects (differentially updated areas).`,
  },
] as const satisfies readonly FieldMeta[];
