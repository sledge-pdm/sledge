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
    path: ['editor', 'centerCanvasWhenWindowResized'],
    label: 'centering canvas when window resized',
    component: 'ToggleSwitch',
    tips: `centering canvas when window resized.`,
  },
  {
    section: Sections.Editor,
    path: ['editor', 'showPointedPixel'],
    label: 'show pointed pixel',
    component: 'ToggleSwitch',
    tips: `whether if shows pointed pixel as rect.`,
  },
];
