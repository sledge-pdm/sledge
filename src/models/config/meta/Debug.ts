import { FieldMeta } from '~/models/config/GlobalConfig';
import { Sections } from '~/models/config/Sections';

export const debugMetas: FieldMeta[] = [
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
];
