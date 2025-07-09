import { themeOptions } from '@sledge/theme';
import { FieldMeta } from '~/models/config/GlobalConfig';
import { Sections } from '~/models/config/Sections';

export const generalMetas: FieldMeta[] = [
  {
    section: Sections.General,
    path: ['appearance', 'theme'],
    label: 'global theme',
    component: 'Dropdown',
    props: {
      options: themeOptions,
    },
    tips: 'global theme of sledge.',
  },
];
