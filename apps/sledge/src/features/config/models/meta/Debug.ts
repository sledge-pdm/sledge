import { FieldMeta } from '~/features/config/models/GlobalConfig';
import { Sections } from '~/features/config/models/Sections';

export const debugMetas: FieldMeta[] = [
  {
    section: Sections.Debug,
    path: ['debug', 'showPerformanceMonitor'],
    label: 'show performance monitor',
    component: 'ToggleSwitch',
    tips: `show performance monitor.`,
  },
  {
    section: Sections.Debug,
    path: ['debug', 'showCanvasDebugOverlay'],
    label: 'show canvas debug overlay',
    component: 'ToggleSwitch',
    tips: `show canvas debug overlay.`,
  },
  // {
  //   section: Sections.Debug,
  //   path: ['debug', 'showDirtyRects'],
  //   label: 'show dirty rects',
  //   component: 'ToggleSwitch',
  //   tips: `show dirty rects (differentially updated areas).`,
  // },
];
