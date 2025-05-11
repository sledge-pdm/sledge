import { Consts } from '~/utils/consts';
import { ConfigComponentName } from './ConfigComponents';

export enum Sections {
  General = 'GENERAL',
  ProjectDefaults = 'DEFAULTS',
  Performance = 'PERFORMANCE',
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

export const settingsMeta = [
  {
    section: Sections.General,
    path: ['misc', 'maxRecentFiles'],
    label: 'max recent files count',
    component: 'Slider',
    props: { min: 1, max: 20, step: 1 },
    tips: 'the max count of "recently opened files" history.',
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
    section: Sections.Performance,
    path: ['performance', 'canvasRenderingMode'],
    label: 'rendering mode',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'adaptive', value: 'adaptive' },
        { label: 'pixelated', value: 'pixelated' },
        { label: 'crispEdges', value: 'crispEdges' },
      ],
    },
    tips: `determines rendering mode of canvas.
"pixelated" shows sharp edges but misses some lines/shapes when zoomed out.
"crispEdges" is stable, but does not show edges of pixels when zoomed in.
"adaptive" will automatically changes those 2 modes (recommended).`,
  },
  {
    section: Sections.Debug,
    path: ['performance', 'enableGLRender'],
    label: 'enable webgl rendering',
    component: 'ToggleSwitch',
    tips: `enable webgl rendering.\ncurrently this config doesn't work because "canvas per layer" mode is completely no use for now.\ndelete me soon.`,
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
