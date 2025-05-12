import { saveGlobalSettings } from '~/io/global_config/globalSettings';
import { setGlobalConfig } from '~/stores/GlobalStores';
import { FileLocation } from '~/types/FileLocation';

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  const path = fileLocation.path;
  const name = fileLocation.name;

  // add to recent
  setGlobalConfig((store) => {
    console.log('path: ' + path);
    console.log('name: ' + name);
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
