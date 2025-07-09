import { FileLocation } from '@sledge/core';
import { addRecentFile } from '~/controllers/config/RecentFileController';
import { openNewFile } from '~/io/open/open';
import { PathToFileLocation } from '~/utils/PathUtils';
import { getExistingProjectSearchParams, getNewProjectSearchParams, openWindow } from '~/utils/WindowUtils';

export const createNew = () => {
  openWindow('editor', { query: getNewProjectSearchParams() }).then(() => {
    // closeWindowsByLabel('start');
  });
};

export const openExistingProject = (selectedFile: FileLocation) => {
  openWindow('editor', { query: getExistingProjectSearchParams(selectedFile) }).then(() => {
    // closeWindowsByLabel('start');
  });
};

export const openProject = () => {
  openNewFile().then((file: string | undefined) => {
    console.log(file);
    if (file !== undefined) {
      const loc = PathToFileLocation(file);
      if (!loc) return;
      addRecentFile(loc);
      openExistingProject(loc);
    }
  });
};
