import { ProjectV0, ProjectV1, ProjectV2 } from '@sledge-pdm/core';

export const SNAPSHOT_THUMBNAIL_SIZE = 500;

export interface ProjectSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  snapshot: ProjectV0 | ProjectV1 | ProjectV2;
  thumbnail?: {
    packedBuffer: Uint8Array;
    width: number;
    height: number;
  };
}
