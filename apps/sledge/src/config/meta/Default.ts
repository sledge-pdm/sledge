import { Consts } from '~/Consts';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';

export const defaultMetas: FieldMeta[] = [
  {
    section: ConfigSections.Default,
    path: ['default', 'open'],
    label: 'open on start',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'new project', value: 'new' },
        { label: 'last opened', value: 'last' },
      ],
    },
    tips: 'the behavior on startup.',
  },
  {
    section: ConfigSections.Default,
    path: ['default', 'canvasSize', 'width'],
    label: 'default canvas width',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1, labelWidth: 72 },
    tips: 'the default canvas size when new project created.',
    customFormat: (v) => v + ' px',
  },
  {
    section: ConfigSections.Default,
    path: ['default', 'canvasSize', 'height'],
    label: 'default canvas height',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1, labelWidth: 72 },
    tips: 'the default canvas size when new project created.',
    customFormat: (v) => v + ' px',
  },
];
