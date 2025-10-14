import { Consts } from '~/Consts';
import { ConfigSections, FieldMeta } from '~/features/config/models/ConfigMeta';

export const defaultMetas: FieldMeta[] = [
  {
    section: ConfigSections.Default,
    path: ['default', 'canvasSize', 'width'],
    label: 'canvas width',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: '[value] px',
  },
  {
    section: ConfigSections.Default,
    path: ['default', 'canvasSize', 'height'],
    label: 'canvas height',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: '[value] px',
  },
];
