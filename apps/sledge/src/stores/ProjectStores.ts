// projectStore.ts
import { Size2D } from '@sledge/core';
import { createStore } from 'solid-js/store';
import { BaseLayer, Layer } from '~/features/layer';

export type CanvasStore = {
  canvas: Size2D;
};
export type ImagePoolStore = {
  selectedEntryId: string | undefined;
  preserveAspectRatio: boolean;
};
export type ProjectStore = {
  loadProjectVersion?: {
    sledge: string; // semver
    project: number; // VX
  };

  thumbnailPath: string | undefined;
  isProjectChangedAfterSave: boolean;
  lastSavedAt: Date | undefined;

  autoSaveEnabled?: boolean;
  autoSaveInterval?: number; // in seconds
};
export type LayerListStore = {
  layers: Layer[];
  baseLayer: BaseLayer;
  activeLayerId: string;
  isImagePoolActive: boolean;
};

const defaultCanvasStore: CanvasStore = {
  canvas: {
    width: 1024,
    height: 1024,
  },
};
const defaultImagePoolStore: ImagePoolStore = {
  selectedEntryId: undefined,
  preserveAspectRatio: true,
};
const defaultProjectStore: ProjectStore = {
  loadProjectVersion: undefined,
  thumbnailPath: undefined as string | undefined,
  isProjectChangedAfterSave: false,
  lastSavedAt: undefined as Date | undefined,
  autoSaveEnabled: false,
  autoSaveInterval: 60,
};
const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  baseLayer: {
    colorMode: 'transparent',
  },
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
