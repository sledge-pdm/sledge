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
  {
    section: ConfigSections.Debug,
    path: 'debug/showDirtyTiles',
    label: 'show dirty tiles',
    component: 'ToggleSwitch',
    tips: `show dirty (changed, but not rendered) tiles.\nthese will briefly flash at higher canvas refresh rates`,
  },
];
