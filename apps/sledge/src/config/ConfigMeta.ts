import type { ConfigFieldOf } from '@sledge/ui';
import type { GlobalConfig } from '~/config/GlobalConfig';

export enum ConfigSections {
  General = 'GENERAL',
  Editor = 'EDITOR',
  Performance = 'PERFORMANCE',
  Default = 'DEFAULTS',
  KeyConfig = 'KEY CONFIG',
  Debug = 'DEBUG',
}

export type FieldMeta = ConfigFieldOf<GlobalConfig> & { section: ConfigSections };
