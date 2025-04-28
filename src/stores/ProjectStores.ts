// projectStore.ts
import { createStore } from 'solid-js/store';
import { Layer } from '~/types/Layer';
import { LayerHistoryStore } from './project/LayerHistoryStore';
import { LayerListStore } from './project/LayerListStore';
import { ProjectStore } from './project/ProjectStore';

const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  activeLayerId: '',
};
const defaultLayerHistoryStore: LayerHistoryStore = {};

const defaultProjectStore: ProjectStore = {
  newName: undefined as string | undefined,
  name: undefined as string | undefined,
  path: undefined as string | undefined,
  isProjectChangedAfterSave: false,
};

export const initProjectStore = () => {
  const [layerListStore, setLayerListStore] = createStore<LayerListStore>(
    defaultLayerListStore
  );
  const [layerHistoryStore, setLayerHistoryStore] =
    createStore<LayerHistoryStore>(defaultLayerHistoryStore);
  const [projectStore, setProjectStore] =
    createStore<ProjectStore>(defaultProjectStore);

  return {
    layerListStore,
    setLayerListStore,
    layerHistoryStore,
    setLayerHistoryStore,
    projectStore,
    setProjectStore,
  };
};
export const loadProject = async (filePath?: string) => {
  //   const projectData = filePath
  //     ? await loadProjectFromFile(filePath)
  //     : createNewProjectData();
  //   setStore(
  //     produce((draft) => {
  //       draft.data = projectData;
  //       draft.loaded = true;
  //     })
  //   );
};

const projectRootStore = initProjectStore();

export const layerListStore = projectRootStore.layerListStore;
export const setLayerListStore = projectRootStore.setLayerListStore;

export const layerHistoryStore = projectRootStore.layerHistoryStore;
export const setLayerHistoryStore = projectRootStore.setLayerHistoryStore;

export const projectStore = projectRootStore.projectStore;
export const setProjectStore = projectRootStore.setProjectStore;
