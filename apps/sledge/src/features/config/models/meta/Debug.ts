import { ConfigSections, FieldMeta } from '~/features/config/models/ConfigMeta';

export const debugMetas: FieldMeta[] = [
  {
    section: ConfigSections.Debug,
    path: ['debug', 'showPerformanceMonitor'],
    label: 'show performance monitor',
    component: 'ToggleSwitch',
    tips: `show performance monitor.`,
  },
];
