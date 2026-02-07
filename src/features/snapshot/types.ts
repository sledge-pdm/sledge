import { ProjectSnapshot } from '@sledge-pdm/core';

export const SNAPSHOT_THUMBNAIL_SIZE = 500;

export type RuntimeProjectSnapshot = Omit<ProjectSnapshot, 'project'> & {
  project: undefined;
};
