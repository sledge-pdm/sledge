import { ConfigComponentName } from '~/features/config/models/ConfigComponent';
import { debugMetas } from '~/features/config/models/meta/Debug';
import { defaultMetas } from '~/features/config/models/meta/Default';
import { editorMetas } from '~/features/config/models/meta/Editor';
import { generalMetas } from '~/features/config/models/meta/General';
import { performanceMetas } from '~/features/config/models/meta/Performance';

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
