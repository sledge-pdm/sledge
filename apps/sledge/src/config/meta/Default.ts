import { Consts } from '~/Consts';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { globalConfig } from '~/stores/GlobalStores';

export const defaultMetas: FieldMeta[] = [
  {
    section: ConfigSections.Default,
    path: ['default', 'open'],
    label: 'project on start',
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
    path: ['default', 'addOnlySavedProjectToLastOpened'],
    label: 'add only saved project to last opened',
    component: 'ToggleSwitch',
    tips: `if enabled, only projects that have been saved at least once will be added to the 'last opened' list.\n
new project will be discarded if you close the app without saving.`,
  },
  {
    section: ConfigSections.Default,
    path: ['default', 'canvasSize', 'width'],
    label: 'default canvas width',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: (v) => v + ' px',
  },
  {
    section: ConfigSections.Default,
    path: ['default', 'canvasSize', 'height'],
    label: 'default canvas height',
    component: 'Slider',
    props: { min: Consts.minCanvasHeight, max: Consts.maxCanvasHeight, step: 1 },
    tips: 'the default canvas size when new project created.',
    customFormat: (v) => v + ' px',
  },
];
