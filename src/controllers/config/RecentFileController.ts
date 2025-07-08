import { saveGlobalSettings } from '~/io/config/save';
import { FileLocation } from '~/models/types/FileLocation';
import { setGlobalConfig } from '~/stores/GlobalStores';

export const setRecentFile = (fileLocations: FileLocation[]) => {
  setGlobalConfig('misc', 'recentFiles', fileLocations);
};

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  const path = fileLocation.path;
  const name = fileLocation.name;

  // add to recent
  setGlobalConfig((store) => {
    if (name && path && store.misc.recentFiles) {
      const oldRecentFiles = store.misc.recentFiles.filter((f) => {
        return f.name !== name || f.path !== path?.toString();
      });
      // その後、一番上に追加
      const newRecentFiles: FileLocation[] = [
        {
          name: name,
          path: path,
        },
        ...oldRecentFiles,
      ];
      setGlobalConfig('misc', 'recentFiles', newRecentFiles);
      saveGlobalSettings();
    }
    return store;
  });
};
