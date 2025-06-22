import { addRecentFile } from '~/controllers/config/RecentFileController';
import { openNewFile } from '~/io/open/open';
import { FileLocation } from '~/models/types/FileLocation';
import { getFileNameAndPath } from '~/utils/PathUtils';
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
      const loc = getFileNameAndPath(file);
      if (!loc) return;
      addRecentFile(loc);
      openExistingProject(loc);
    }
  });
};
