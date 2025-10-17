export type ProjectStore = {
  loadProjectVersion?: {
    sledge: string; // semver
    project: number; // VX
  };

  thumbnailPath: string | undefined;
  isProjectChangedAfterSave: boolean;
  lastSavedPath: string | undefined;
  lastSavedAt: Date | undefined;

  autoSaveEnabled?: boolean;
  autoSaveInterval?: number; // in seconds
};

export const defaultProjectStore: ProjectStore = {
  loadProjectVersion: undefined,
  thumbnailPath: undefined as string | undefined,
  isProjectChangedAfterSave: false,
  lastSavedPath: undefined,
  lastSavedAt: undefined as Date | undefined,
  autoSaveEnabled: false,
  autoSaveInterval: 60,
};
