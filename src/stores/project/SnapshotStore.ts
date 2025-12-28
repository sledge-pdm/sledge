import { ProjectV0, ProjectV1 } from '~/features/io/types/Project';

export const SNAPSHOT_THUMBNAIL_SIZE = 500;

export interface ProjectSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  snapshot: ProjectV0 | ProjectV1;
  thumbnail?: {
    webpBuffer: Uint8Array;
    width: number;
    height: number;
  };
}

export type SnapshotStore = {
  snapshots: ProjectSnapshot[];
};

export const defaultSnapshotStore: SnapshotStore = {
  snapshots: [],
};
