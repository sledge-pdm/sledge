import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';

export const protectionMetas: FieldMeta[] = [
  {
    section: ConfigSections.Protection,
    kind: 'header',
    header: 'layer',
  },
  {
    section: ConfigSections.Protection,
    path: 'editor/requireConfirmBeforeLayerRemove',
    label: 'confirm before remove',
    component: 'ToggleSwitch',
    tips: `require confirm before removing layer. if disabled, skip confirm.`,
  },
  {
    section: ConfigSections.Protection,
    path: 'editor/requireConfirmBeforeLayerClear',
    label: 'confirm before clear',
    component: 'ToggleSwitch',
    tips: `require confirm before clearing layer. if disabled, skip confirm.`,
  },
];
