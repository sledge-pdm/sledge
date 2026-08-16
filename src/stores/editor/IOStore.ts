import { FileLocation } from '@sledge-pdm/core';

export type IOStore = {
  isInInitialLoading: boolean;
  /** File location being loaded during initial startup, shown in titlebar while loading. Cleared after load. */
  loadingTargetPath?: FileLocation;
  openAs: 'project' | 'new_project' | 'image';
  savedLocation: FileLocation;
  recentFiles: FileLocation[];

  loadProjectVersion?: {
    sledge: string; // semver
    project: number; // Vx
  };

  /**
   * @description bumped by every change that would be lost without saving.
   *   this is a revision rather than a dirty flag because saving is asynchronous: a change that lands
   *   while a save is assembling its bytes is not in the file, and clearing a flag at write time would
   *   have reported it as saved anyway.
   */
  projectRevision: number;
  /** @description the projectRevision the file on disk was written from. */
  savedRevision: number;
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
  projectRevision: 0,
  savedRevision: 0,
};
