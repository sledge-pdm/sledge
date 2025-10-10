import { FieldMeta } from '~/features/config/models/GlobalConfig';
import { Sections } from '~/features/config/models/Sections';

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
    path: ['editor', 'centerCanvasOnResize'],
    label: 'center canvas on resize',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'disabled', value: 'disabled' },
        { label: 'offset only', value: 'offset' },
        { label: 'offset+zoom', value: 'offset_zoom' },
      ],
    },
    tips: `centering canvas when area resized.`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'maxHistoryItemsCount'],
    label: 'max history items count',
    component: 'Slider',
    props: {
      min: 10,
      max: 100,
      step: 1,
      allowFloat: false,
      customFormat: '[value]',
    },
    tips: `the maximum number of history items to keep.`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'touchRotationZeroSnapThreshold'],
    label: '0 degree snap threshold (2 finger touch)',
    component: 'Slider',
    props: {
      min: 1,
      max: 90,
      step: 1,
      allowFloat: false,
      customFormat: '[value]',
    },
    tips: `Available in two-finger touch rotation only.\ncanvas rotation degree will be snapped to 0° until this threshold.`,
  },
];
