import { ProjectBase, Size2D } from '@sledge-pdm/core';

export const SNAPSHOT_THUMBNAIL_SIZE = 500;

export interface ProjectSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  project: ProjectBase;
  projectVersion?: number;
  canvasSize?: Size2D;
  thumbnail?: {
    packedBuffer: Uint8Array;
    width: number;
    height: number;
  };
}

export type RuntimeProjectSnapshot = Omit<ProjectSnapshot, 'project'> & {
  project: undefined;
};
