import { Consts } from '~/Consts';
import { FieldMeta } from '~/features/config/models/GlobalConfig';
import { Sections } from '~/features/config/models/Sections';

export const defaultMetas: FieldMeta[] = [
  {
    section: Sections.ProjectDefaults,
    path: ['default', 'canvasSize', 'width'],
    label: 'canvas width',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: '[value] px',
  },
  {
    section: Sections.ProjectDefaults,
    path: ['default', 'canvasSize', 'height'],
    label: 'canvas height',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: '[value] px',
  },
];
