import type { ConfigFieldOf } from '@sledge/ui';
import type { GlobalConfig } from '~/config/GlobalConfig';

export enum ConfigSections {
  General = 'GENERAL',
  Performance = 'PERFORMANCE',
  Canvas = 'CANVAS',
  Startup = 'STARTUP',
  Protection = 'PROTECTION',
  Shortcuts = 'SHORTCUTS',
  Debug = 'DEBUG',
}

export type FieldHeaderMeta = {
  section: ConfigSections;
  kind: 'header';
  header: string;
};

export type FieldValueMeta = ConfigFieldOf<GlobalConfig> & { section: ConfigSections; kind?: 'field' };

export type FieldMeta = FieldValueMeta | FieldHeaderMeta;

export const isHeaderMeta = (meta: FieldMeta): meta is FieldHeaderMeta => meta.kind === 'header';
