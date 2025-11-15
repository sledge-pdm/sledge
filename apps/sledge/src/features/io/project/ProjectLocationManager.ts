import { FileLocation } from '@sledge/core';
import { setFileStore, fileStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';
import { normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';

export type ProjectOpenMode = 'project' | 'new_project' | 'image';

const emptyLocation: FileLocation = {
  name: undefined,
  path: undefined,
};

export const getActiveProjectLocation = (): FileLocation => ({
  name: fileStore.savedLocation.name,
  path: fileStore.savedLocation.path,
});

export const hasActiveProjectLocation = () => Boolean(fileStore.savedLocation.path && fileStore.savedLocation.name);


export function applyProjectLocation(location: FileLocation | undefined, openAs: ProjectOpenMode = 'project'): void {
  const resolved = location
    ? {
        name: location.name,
        path: location.path,
      }
    : emptyLocation;

  setFileStore('savedLocation', resolved);
  setFileStore('openAs', openAs);

  if (openAs === 'project' && resolved.path && resolved.name) {
    setProjectStore('lastSavedPath', normalizeJoin(resolved.path, resolved.name));
  } else {
    setProjectStore('lastSavedPath', undefined);
  }
}

export function applyProjectLocationFromPath(path: string, openAs: ProjectOpenMode = 'project'): FileLocation | undefined {
  const parsed = pathToFileLocation(path);
  if (!parsed) return undefined;
  applyProjectLocation(parsed, openAs);
  return parsed;
}
