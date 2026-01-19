// projectStore.ts
import { createStore } from 'solid-js/store';
import { ImagePoolStore, defaultImagePoolStore } from '~/stores/project/ImagePoolStore';
import { ProjectStore, defaultProjectStore } from '~/stores/project/ProjectStore';
import { SnapshotStore, defaultSnapshotStore } from '~/stores/project/SnapshotStore';

export const initProjectStore = () => {
  const [imagePoolStore, setImagePoolStore] = createStore<ImagePoolStore>(defaultImagePoolStore);
  const [projectStore, setProjectStore] = createStore<ProjectStore>(defaultProjectStore);
  const [snapshotStore, setSnapshotStore] = createStore<SnapshotStore>(defaultSnapshotStore);

  return {
    imagePoolStore,
    setImagePoolStore,
    projectStore,
    setProjectStore,
    snapshotStore,
    setSnapshotStore,
  };
};

const projectRootStore = initProjectStore();

export const imagePoolStore = projectRootStore.imagePoolStore;
export const setImagePoolStore = projectRootStore.setImagePoolStore;

export const projectStoreFormer = projectRootStore.projectStore;
export const setProjectStoreFormer = projectRootStore.setProjectStore;

export const snapshotStore = projectRootStore.snapshotStore;
export const setSnapshotStore = projectRootStore.setSnapshotStore;
