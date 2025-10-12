import { FileLocation } from '@sledge/core';

export type FileStore = {
  openAs: 'project' | 'image';
  savedLocation: FileLocation;
};

export const defaultFileStore: FileStore = {
  openAs: 'project',
  savedLocation: {
    name: undefined,
    path: undefined,
  },
};
