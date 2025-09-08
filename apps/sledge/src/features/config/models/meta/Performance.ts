import { FieldMeta } from '~/features/config/models/GlobalConfig';
import { Sections } from '~/features/config/models/Sections';

export const performanceMetas: FieldMeta[] = [
  {
    section: Sections.Performance,
    path: ['performance', 'canvasRenderingMode'],
    label: 'rendering mode',
    component: 'Dropdown',
    props: {
      options: [
        { label: 'adaptive', value: 'adaptive' },
        { label: 'pixelated', value: 'pixelated' },
        { label: 'crispEdges', value: 'crisp-edges' },
      ],
    },
    tips: `determines rendering mode of canvas.
"pixelated" shows sharp edges but misses some lines/shapes when zoomed out.
"crispEdges" is stable, but does not show edges of pixels when zoomed in.
"adaptive" will automatically changes those 2 modes (recommended).`,
  },
  {
    section: Sections.Performance,
    path: ['performance', 'targetFPS'],
    label: 'target fps',
    component: 'Dropdown',
    props: {
      options: [
        { label: '30', value: '30' },
        { label: '60', value: '60' },
        { label: '144', value: '144' },
      ],
    },
    tips: `cursor type.`,
  },
];
