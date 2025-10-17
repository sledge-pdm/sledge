import { ConfigComponentName } from '~/config/ConfigComponent';

export enum ConfigSections {
  General = 'GENERAL',
  Editor = 'EDITOR',
  Performance = 'PERFORMANCE',
  Default = 'DEFAULTS',
  KeyConfig = 'KEY CONFIG',
  Debug = 'DEBUG',
}

export type FieldMeta = {
  section: ConfigSections;
  path: readonly string[];
  label: string;
  component: ConfigComponentName;
  props?: Record<string, any>; // min/max/step/options など
  tips?: string;
  customFormat?: string; // format: [value] => value
};
