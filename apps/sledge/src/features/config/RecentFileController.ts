import { FileLocation } from '@sledge/core';
import { saveGlobalSettings } from '~/features/io/config/save';
import { setFileStore } from '~/stores/EditorStores';

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  setFileStore('recentFiles', (files) => {
    files.unshift(fileLocation);
    return files;
  });
  saveGlobalSettings(true);
};
