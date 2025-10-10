import { FileLocation } from '@sledge/core';
import { GlobalConfig } from '~/features/config/models/GlobalConfig';
import { saveGlobalSettings } from '~/features/io/config/save';
import { setGlobalConfig } from '~/stores/GlobalStores';

export const setRecentFile = (fileLocations: FileLocation[]) => {
  setGlobalConfig('misc', 'recentFiles', fileLocations);
};

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  const path = fileLocation.path;
  const name = fileLocation.name;

  // add to recent
  setGlobalConfig((store: GlobalConfig) => {
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
      saveGlobalSettings(true);
    }
    return store;
  });
};
