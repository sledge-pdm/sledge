import { FileLocation } from '@sledge-pdm/core';

export type IOStore = {
  isInInitialLoading: boolean;
  openAs: 'project' | 'new_project' | 'image';
  savedLocation: FileLocation;
  recentFiles: FileLocation[];

  loadProjectVersion?: {
    sledge: string; // semver
    project: number; // Vx
  };
  isProjectChangedAfterSave: boolean;
};

export const defaultIOStore: IOStore = {
  isInInitialLoading: true,
  openAs: 'new_project',
  savedLocation: {
    name: undefined,
    path: undefined,
  },
  recentFiles: [],

  loadProjectVersion: undefined,
  isProjectChangedAfterSave: false,
};
