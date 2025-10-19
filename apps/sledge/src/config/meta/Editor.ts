import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';

export const editorMetas: FieldMeta[] = [
  {
    section: ConfigSections.Editor,
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
    section: ConfigSections.Editor,
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
    section: ConfigSections.Editor,
    path: ['editor', 'showPointedPixel'],
    label: 'show pointed pixel',
    component: 'ToggleSwitch',
    tips: `whether if shows pointed pixel as rect.`,
  },
  {
    section: ConfigSections.Editor,
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
    section: ConfigSections.Editor,
    path: ['editor', 'centerCanvasOnMaximize'],
    label: 'center canvas on window maximize',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'disabled', value: 'disabled' },
        { label: 'offset only', value: 'offset' },
        { label: 'offset+zoom', value: 'offset_zoom' },
      ],
    },
    tips: `centering canvas when window maximized.`,
  },
  {
    section: ConfigSections.Editor,
    path: ['editor', 'requireConfirmBeforeLayerRemove'],
    label: 'require confirm before removing layer',
    component: 'ToggleSwitch',
    tips: `require confirm before removing layer. if disabled, skip confirm.`,
  },
  {
    section: ConfigSections.Editor,
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
    section: ConfigSections.Editor,
    path: ['editor', 'touchRotationZeroSnapThreshold'],
    label: '0 degree snap threshold (2 finger touch)',
    component: 'Slider',
    props: {
      min: 1,
      max: 15,
      step: 1,
      allowFloat: false,
    },
    tips: `Available in two-finger touch rotation only.\ncanvas rotation degree will be snapped to 0° until this threshold.`,
  },
];
