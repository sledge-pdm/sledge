import { saveGlobalSettings } from '~/io/global_config/globalSettings';
import { setGlobalStore } from '~/stores/GlobalStores';
import { FileLocation } from '~/types/FileLocation';

export const addRecentFile = (fileLocation?: FileLocation) => {
  if (!fileLocation) return;
  const path = fileLocation.path;
  const name = fileLocation.name;

  // add to recent
  setGlobalStore((store) => {
    console.log('path: ' + path);
    console.log('name: ' + name);
    if (name && path && store.recentFiles) {
      const oldRecentFiles = store.recentFiles.filter((f) => {
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
      setGlobalStore('recentFiles', newRecentFiles);
      saveGlobalSettings();
    }
    return store;
  });
};
