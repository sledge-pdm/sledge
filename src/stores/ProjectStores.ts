// projectStore.ts
import { ReactiveMap } from '@solid-primitives/map';
import { createStore } from 'solid-js/store';
import { resetLayerImage } from '~/controllers/canvas/layer/LayerController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { Layer } from '~/models/canvas/layer/Layer';
import { fallbackLayerProps } from '~/models/canvas/layer/LayerFactory';
import { LayerHistory } from '~/models/history/LayerHistory';
import { Size2D } from '~/types/Size';

type CanvasStore = {
  canvas: Size2D;
};
type ImagePoolStore = {
  entries: ReactiveMap<string, ImagePoolEntry>;
};
type ProjectStore = {
  newName: string | undefined;
  name: string | undefined;
  path: string | undefined;
  thumbnailPath: string | undefined;
  isProjectChangedAfterSave: boolean;
};
type LayerHistoryStore = Record<string, LayerHistory>;
type LayerListStore = {
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
  newName: undefined as string | undefined,
  name: undefined as string | undefined,
  path: undefined as string | undefined,
  thumbnailPath: undefined as string | undefined,
  isProjectChangedAfterSave: false,
};
const defaultLayerHistoryStore: LayerHistoryStore = {};
const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  activeLayerId: '',
  isImagePoolActive: false,
};

export const initProjectStore = () => {
  const [canvasStore, setCanvasStore] = createStore<CanvasStore>(defaultCanvasStore);
  const [imagePoolStore, setImagePoolStore] = createStore<ImagePoolStore>(defaultImagePoolStore);
  const [projectStore, setProjectStore] = createStore<ProjectStore>(defaultProjectStore);
  const [layerHistoryStore, setLayerHistoryStore] = createStore<LayerHistoryStore>(defaultLayerHistoryStore);
  const [layerListStore, setLayerListStore] = createStore<LayerListStore>(defaultLayerListStore);

  return {
    canvasStore,
    setCanvasStore,
    imagePoolStore,
    setImagePoolStore,
    layerListStore,
    setLayerListStore,
    layerHistoryStore,
    setLayerHistoryStore,
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

export const layerHistoryStore = projectRootStore.layerHistoryStore;
export const setLayerHistoryStore = projectRootStore.setLayerHistoryStore;

export const projectStore = projectRootStore.projectStore;
export const setProjectStore = projectRootStore.setProjectStore;

export const loadStoreFromProjectJson = async (projectJson: any) => {
  if (projectJson.canvas) {
    const { width, height } = projectJson.canvas;
    setCanvasStore('canvas', 'width', width);
    setCanvasStore('canvas', 'height', height);
  }

  if (projectJson.imagePool.entries) {
    console.log(projectJson.imagePool.entries);
    let entries: ReactiveMap<string, ImagePoolEntry> = new ReactiveMap(projectJson.imagePool.entries);
    setImagePoolStore('entries', entries);
    console.log(entries);
  }

  if (projectJson.project) {
    setProjectStore('name', projectJson.project.name || undefined);
    setProjectStore('path', projectJson.project.path || undefined);
  }

  if (projectJson.layer && projectJson.layer.layers && Array.isArray(projectJson.layer.layers)) {
    const layers: Layer[] = [];
    projectJson.layer.layers.map((l: any) => {
      layers.push({
        ...fallbackLayerProps,
        ...l,
        dsl: undefined,
      } as Layer);
    });

    setLayerListStore('layers', layers);
    setLayerListStore('activeLayerId', projectJson.layer.activeLayerId);
    setLayerListStore('isImagePoolActive', projectJson.layer.isImagePoolActive);
  }

  if (projectJson.images) {
    setLayerHistoryStore({});
    Object.keys(projectJson.images).forEach((id) => {
      const data = projectJson.images[id];
      const agent = resetLayerImage(id, Number(data.dotMagnification || 1), data.width, data.height);
      agent.setBuffer(Uint8ClampedArray.from(data.current));
    });
  }
};
