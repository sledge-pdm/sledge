export type ProjectStore = {
  loadProjectVersion?: {
    sledge: string; // semver
    project: number; // VX
  };

  thumbnailPath: string | undefined;
  isProjectChangedAfterSave: boolean;
  lastSavedPath: string | undefined;
  lastSavedAt: Date | undefined;

  autoSnapshotEnabled?: boolean;
  autoSnapshotInterval?: number; // in seconds
};

export const defaultProjectStore: ProjectStore = {
  loadProjectVersion: undefined,
  thumbnailPath: undefined as string | undefined,
  isProjectChangedAfterSave: false,
  lastSavedPath: undefined,
  lastSavedAt: undefined as Date | undefined,

  autoSnapshotEnabled: false,
  autoSnapshotInterval: 60,
};
