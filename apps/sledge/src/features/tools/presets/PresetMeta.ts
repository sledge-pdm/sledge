import { ConfigComponentName } from '~/config/ConfigComponent';

export type PresetFieldMeta = {
  key: string;
  label: string;
  component: ConfigComponentName;
  props?: Record<string, any>; // min/max/step/options など
  tips?: string;
  customFormat?: string; // format: [value] => value
  condition?: () => boolean;
};

export type ToolPresetMeta = {
  toolId: string;
  fields: PresetFieldMeta[];
};
