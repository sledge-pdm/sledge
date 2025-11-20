import type { ComponentPropsMap, ConfigComponentFactory, ConfigComponentName } from '@sledge/ui';

export type PresetFieldMeta<
  TConfig = Record<string, any>,
  C extends ConfigComponentName | ConfigComponentFactory<any> = ConfigComponentName | ConfigComponentFactory<any>,
> = {
  key: keyof TConfig | (string & {});
  label?: string;
  component: C;
  props?: C extends ConfigComponentName ? ComponentPropsMap[C] : never;
  tips?: string;
  customFormat?: (value: number) => string;
  condition?: () => boolean;
};

export type ToolPresetMeta = {
  toolId: string;
  fields: PresetFieldMeta[];
};
