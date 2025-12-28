import CanvasSizeInput from '~/components/section/project/item/CanvasSizeInput';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { Consts } from '~/Consts';

export const startupMetas: FieldMeta[] = [
  { section: ConfigSections.Startup, kind: 'header', header: 'open' },
  {
    section: ConfigSections.Startup,
    path: 'default/open',
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
  { section: ConfigSections.Startup, kind: 'header', header: 'project' },
  {
    section: ConfigSections.Startup,
    path: 'default/canvasSize',
    label: 'default canvas size',
    component: ({ value, onChange }) => (
      <CanvasSizeInput
        value={value() ?? { width: Consts.minCanvasWidth, height: Consts.minCanvasHeight }}
        minWidth={Consts.minCanvasWidth}
        maxWidth={Consts.maxCanvasWidth}
        minHeight={Consts.minCanvasHeight}
        maxHeight={Consts.maxCanvasHeight}
        applyLabel='apply'
        onApply={onChange}
      />
    ),
    tips: 'the default canvas size when new project created.',
  },
];
