import { FileLocation } from '@sledge/core';

export type FileStore = {
  openAs: 'project' | 'image';
  savedLocation: FileLocation;
  recentFiles: FileLocation[];
};

export const defaultFileStore: FileStore = {
  openAs: 'project',
  savedLocation: {
    name: undefined,
    path: undefined,
  },
  recentFiles: [],
};
