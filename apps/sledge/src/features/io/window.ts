import { FileLocation } from '@sledge/core';
import { addRecentFile } from '~/features/config/RecentFileController';
import { openNewFile } from '~/features/io/open/open';
import { normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';
import { getNewProjectSearchParams, openWindow } from '~/utils/WindowUtils';

export const createNew = () => {
  openWindow('editor', { query: getNewProjectSearchParams() }).then(() => {
    // closeWindowsByLabel('start');
  });
};

export const openExistingProject = async (selectedFile: FileLocation) => {
  if (!selectedFile.path || !selectedFile.name) return;
  await openWindow('editor', { openPath: normalizeJoin(selectedFile.path, selectedFile.name) }).then(() => {
    // closeWindowsByLabel('start');
  });
};

export const openProject = () => {
  openNewFile().then((file: string | undefined) => {
    console.log(file);
    if (file !== undefined) {
      const loc = pathToFileLocation(file);
      if (!loc) return;
      addRecentFile(loc);
      openExistingProject(loc);
    }
  });
};
