import { saveEditorStateDebounced } from '~/features/io/editor/save';
import { setIOStore } from '~/stores/EditorStores';
import { FileLocation } from '~/types/FileLocation';

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  setIOStore('recentFiles', (files) => {
    files = files.filter((loc) => loc.path !== fileLocation.path || loc.name !== fileLocation.name);
    files.unshift(fileLocation);
    return [...files];
  });
  saveEditorStateDebounced();
};
