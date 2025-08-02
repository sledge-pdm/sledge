import { FieldMeta } from '~/models/config/GlobalConfig';
import { Sections } from '~/models/config/Sections';

export const editorMetas: FieldMeta[] = [
  {
    section: Sections.Editor,
    path: ['editor', 'cursor'],
    label: 'cursor',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'none', value: 'none' },
        { label: 'pixel', value: 'pixel' },
        { label: 'cross', value: 'cross' },
      ],
    },
    tips: `cursor type.`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'rotateDegreePerWheelScroll'],
    label: 'rotate degree per wheel',
    component: 'Slider',
    props: {
      min: 1,
      max: 45,
      step: 1,
      customFormat: '[value]°',
    },
    tips: `the amount of rotation per wheel scroll.`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'showPointedPixel'],
    label: 'show pointed pixel',
    component: 'ToggleSwitch',
    tips: `whether if shows pointed pixel as rect.`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'centerCanvasWhenWindowResized'],
    label: 'centering canvas when window resized',
    component: 'ToggleSwitch',
    tips: `centering canvas when window resized.`,
  },
];
