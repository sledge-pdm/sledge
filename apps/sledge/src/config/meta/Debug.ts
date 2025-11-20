import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';

export const debugMetas: FieldMeta[] = [
  {
    section: ConfigSections.Debug,
    path: 'debug/showPerformanceMonitor',
    label: 'show performance monitor',
    component: 'ToggleSwitch',
    tips: `show performance monitor.`,
  },
];
