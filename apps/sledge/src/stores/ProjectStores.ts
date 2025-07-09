// projectStore.ts
import { Size2D } from '@sledge/core';
import { ReactiveMap } from '@solid-primitives/map';
import { createStore } from 'solid-js/store';
import { Layer } from '~/models/layer/Layer';

export type CanvasStore = {
  canvas: Size2D;
};
export type ImagePoolStore = {
  entries: ReactiveMap;
};
export type ProjectStore = {
  name: string | undefined;
  path: string | undefined;
  thumbnailPath: string | undefined;
  isProjectChangedAfterSave: boolean;
};
export type LayerListStore = {
  layers: Layer[];
  activeLayerId: string;
  isImagePoolActive: boolean;
};

const defaultCanvasStore: CanvasStore = {
  canvas: {
    width: 400,
    height: 400,
  },
};
const defaultImagePoolStore: ImagePoolStore = {
  entries: new ReactiveMap(),
};
const defaultProjectStore: ProjectStore = {
  name: undefined as string | undefined,
  path: undefined as string | undefined,
  thumbnailPath: undefined as string | undefined,
  isProjectChangedAfterSave: false,
};
const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  activeLayerId: '',
  isImagePoolActive: true,
};

export const initProjectStore = () => {
  const [canvasStore, setCanvasStore] = createStore<CanvasStore>(defaultCanvasStore);
  const [imagePoolStore, setImagePoolStore] = createStore<ImagePoolStore>(defaultImagePoolStore);
  const [projectStore, setProjectStore] = createStore<ProjectStore>(defaultProjectStore);
  const [layerListStore, setLayerListStore] = createStore<LayerListStore>(defaultLayerListStore);

  return {
    canvasStore,
    setCanvasStore,
    imagePoolStore,
    setImagePoolStore,
    layerListStore,
    setLayerListStore,
    projectStore,
    setProjectStore,
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
