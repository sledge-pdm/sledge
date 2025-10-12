// projectStore.ts
import { createStore } from 'solid-js/store';
import { CanvasStore, defaultCanvasStore } from '~/stores/project/CanvasStore';
import { ImagePoolStore, defaultImagePoolStore } from '~/stores/project/ImagePoolStore';
import { LayerListStore, defaultLayerListStore } from '~/stores/project/LayerListStore';
import { ProjectStore, defaultProjectStore } from '~/stores/project/ProjectStore';
import { SnapshotStore, defaultSnapshotStore } from '~/stores/project/SnapshotStore';

export const initProjectStore = () => {
  const [canvasStore, setCanvasStore] = createStore<CanvasStore>(defaultCanvasStore);
  const [imagePoolStore, setImagePoolStore] = createStore<ImagePoolStore>(defaultImagePoolStore);
  const [projectStore, setProjectStore] = createStore<ProjectStore>(defaultProjectStore);
  const [layerListStore, setLayerListStore] = createStore<LayerListStore>(defaultLayerListStore);
  const [snapshotStore, setSnapshotStore] = createStore<SnapshotStore>(defaultSnapshotStore);

  return {
    canvasStore,
    setCanvasStore,
    imagePoolStore,
    setImagePoolStore,
    layerListStore,
    setLayerListStore,
    projectStore,
    setProjectStore,
    snapshotStore,
    setSnapshotStore,
  };
};

const projectRootStore = initProjectStore();

export const canvasStore = projectRootStore.canvasStore;
export const setCanvasStore = projectRootStore.setCanvasStore;

export const imagePoolStore = projectRootStore.imagePoolStore;
export const setImagePoolStore = projectRootStore.setImagePoolStore;

export const layerListStore = projectRootStore.layerListStore;
export const setLayerListStore = projectRootStore.setLayerListStore;

export const projectStore = projectRootStore.projectStore;
export const setProjectStore = projectRootStore.setProjectStore;

export const snapshotStore = projectRootStore.snapshotStore;
export const setSnapshotStore = projectRootStore.setSnapshotStore;
