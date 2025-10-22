import { FileLocation } from '@sledge/core';
import { saveEditorState } from '~/features/io/editor/save';
import { setFileStore } from '~/stores/EditorStores';

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  setFileStore('recentFiles', (files) => {
    files = files.filter((loc) => loc.path !== fileLocation.path || loc.name !== fileLocation.name);
    files.unshift(fileLocation);
    return [...files];
  });
  saveEditorState();
};
