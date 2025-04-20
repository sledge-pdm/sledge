import { createStore } from "solid-js/store";
import { saveGlobalSettings } from "~/io/global/globalIO";

// project
export type FileLocation = {
  path: string;
  name: string;
};

export const [globalStore, setGlobalStore] = createStore({
  recentOpenedFiles: [
    {
      path: "C:\\Users\\innsb\\Documents",
      name: "project.sledge",
    },
  ],
});

export const addRecent = (loc: FileLocation) => {
  const path = loc.path;
  const name = loc.name;

  // add to recent
  setGlobalStore((store) => {
    console.log("path: " + path);
    console.log("name: " + name);
    if (name && path && store.recentOpenedFiles) {
      // 履歴にあっても一旦削除
      let oldRecentFiles = store.recentOpenedFiles.filter((f) => {
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
      setGlobalStore("recentOpenedFiles", newRecentFiles);
      saveGlobalSettings();
    }
    return store;
  });
};
