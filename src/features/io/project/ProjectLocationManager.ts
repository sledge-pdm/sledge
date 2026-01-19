import { FileLocation } from '@sledge-pdm/core';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { setProjectStoreFormer } from '~/stores/ProjectStores';
import { normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';

export type ProjectOpenMode = 'project' | 'new_project' | 'image';

const emptyLocation: FileLocation = {
  name: undefined,
  path: undefined,
};

export const getActiveProjectLocation = (): FileLocation => ({
  name: ioStore.savedLocation.name,
  path: ioStore.savedLocation.path,
});

export const hasActiveProjectLocation = () => Boolean(ioStore.savedLocation.path && ioStore.savedLocation.name);

export function applyProjectLocation(location: FileLocation | undefined, openAs: ProjectOpenMode = 'project'): void {
  const resolved = location
    ? {
        name: location.name,
        path: location.path,
      }
    : emptyLocation;

  setIOStore('savedLocation', resolved);
  setIOStore('openAs', openAs);

  if (openAs === 'project' && resolved.path && resolved.name) {
    setProjectStoreFormer('lastSavedPath', normalizeJoin(resolved.path, resolved.name));
  } else {
    setProjectStoreFormer('lastSavedPath', undefined);
  }
}

export function applyProjectLocationFromPath(path: string, openAs: ProjectOpenMode = 'project'): FileLocation | undefined {
  const parsed = pathToFileLocation(path);
  if (!parsed) return undefined;
  applyProjectLocation(parsed, openAs);
  return parsed;
}
