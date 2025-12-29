import { FileLocation } from '@sledge-pdm/core';

export type FileStore = {
  openAs: 'project' | 'new_project' | 'image';
  savedLocation: FileLocation;
  recentFiles: FileLocation[];
};

export const defaultFileStore: FileStore = {
  openAs: 'new_project',
  savedLocation: {
    name: undefined,
    path: undefined,
  },
  recentFiles: [],
};
