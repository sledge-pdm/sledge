import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';

export const debugMetas: FieldMeta[] = [
  { section: ConfigSections.Debug, kind: 'header', header: 'monitor' },
  {
    section: ConfigSections.Debug,
    path: 'debug/showPerformanceMonitor',
    label: 'show performance monitor',
    component: 'ToggleSwitch',
    tips: `show performance monitor.`,
  },
  { section: ConfigSections.Debug, kind: 'header', header: 'pen/eraser (experimental)' },
  {
    section: ConfigSections.Debug,
    path: 'debug/useRawMove',
    label: 'use raw pointer update',
    component: 'ToggleSwitch',
    tips: 'use pointerrawupdate for pen/eraser instead of pointermove.',
  },
  {
    section: ConfigSections.Debug,
    path: 'debug/disableCompletionLine',
    label: 'disable completion line',
    component: 'ToggleSwitch',
    tips: 'disable line completion between samples for pen/eraser.',
  },
  { section: ConfigSections.Debug, kind: 'header', header: 'updates' },
  {
    section: ConfigSections.Debug,
    path: 'debug/updateChannel',
    label: 'update channel',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'stable', value: 'stable' },
        { label: 'dev', value: 'dev' },
      ],
    },
    tips: 'preferring update chennel.',
  },
];
