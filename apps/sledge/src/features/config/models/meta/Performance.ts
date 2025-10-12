import { ConfigSections, FieldMeta } from '~/features/config/models/ConfigMeta';

export const performanceMetas: FieldMeta[] = [
  {
    section: ConfigSections.Performance,
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
    tips: `FPS for canvas and some of ui elements' update.`,
  },
  {
    section: ConfigSections.Performance,
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
];
