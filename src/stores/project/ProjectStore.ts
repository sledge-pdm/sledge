export type ProjectStore = {
  thumbnailPath: string | undefined;
  lastSavedPath: string | undefined;
  lastSavedAt: Date | undefined;

  autoSnapshotEnabled?: boolean;
  autoSnapshotInterval?: number; // in seconds
};

export const defaultProjectStore: ProjectStore = {
  thumbnailPath: undefined as string | undefined,
  lastSavedPath: undefined,
  lastSavedAt: undefined as Date | undefined,

  autoSnapshotEnabled: false,
  autoSnapshotInterval: 60,
};
