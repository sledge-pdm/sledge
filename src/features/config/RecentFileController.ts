import { FileLocation } from '@sledge-pdm/core';
import { saveEditorStateDebounced } from '~/features/io/editor/save';
import { setIOStore } from '~/stores/EditorStores';

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  setIOStore('recentFiles', (files) => {
    files = files.filter((loc) => loc.path !== fileLocation.path || loc.name !== fileLocation.name);
    files.unshift(fileLocation);
    return [...files];
  });
  saveEditorStateDebounced();
};
