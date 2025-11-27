import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';

export const canvasMetas: FieldMeta[] = [
  {
    section: ConfigSections.Canvas,
    kind: 'header',
    header: 'pointer',
  },
  {
    section: ConfigSections.Canvas,
    path: 'editor/cursor',
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
    section: ConfigSections.Canvas,
    path: 'editor/showPointedPixel',
    label: 'show pointed pixel',
    component: 'ToggleSwitch',
    tips: `whether if shows pointed pixel as rect.`,
  },
  { section: ConfigSections.Canvas, kind: 'header', header: 'zoom / rotate' },
  {
    section: ConfigSections.Canvas,
    path: 'editor/rotateDegreePerWheelScroll',
    label: 'rotate degree per wheel',
    component: 'Slider',
    props: {
      min: 1,
      max: 45,
      step: 1,
    },
    customFormat: (v) => v + '°',
    tips: `the amount of rotation per wheel scroll.`,
  },
  {
    section: ConfigSections.Canvas,
    path: 'editor/touchRotationZeroSnapThreshold',
    label: '0 degree snap threshold (on touch)',
    component: 'Slider',
    props: {
      min: 1,
      max: 15,
      step: 1,
      allowFloat: false,
    },
    customFormat: (v) => v + '°',
    tips: `Available in two-finger touch rotation only.\ncanvas rotation degree will be snapped to 0° until this threshold.`,
  },
  {
    section: ConfigSections.Canvas,
    path: 'editor/centerCanvasOnResize',
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
    section: ConfigSections.Canvas,
    path: 'editor/centerCanvasOnMaximize',
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
  { section: ConfigSections.Canvas, kind: 'header', header: 'misc' },
  {
    section: ConfigSections.Canvas,
    path: 'editor/rulerMarkDirection',
    label: 'ruler mark direction',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'outward', value: 'outward' },
        { label: 'inward', value: 'inward' },
      ],
    },
    tips: `direction of ruler marks. outward: marks extend away from canvas, inward: marks extend into canvas area.`,
  },
];
