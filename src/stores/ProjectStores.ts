// projectStore.ts
import { createStore } from 'solid-js/store';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { LayerHistory } from '~/models/history/LayerHistory';
import { Layer } from '~/models/layer/Layer';
import { fallbackLayerProps } from '~/models/layer/LayerFactory';
import { Size2D } from '~/types/Size';

type CanvasStore = {
  canvas: Size2D;
};
type ProjectStore = {
  newName: string | undefined;
  name: string | undefined;
  path: string | undefined;
  isProjectChangedAfterSave: boolean;
};
type LayerHistoryStore = Record<string, LayerHistory>;
type LayerListStore = {
  layers: Layer[];
  activeLayerId: string;
};

const defaultProjectStore: ProjectStore = {
  newName: undefined as string | undefined,
  name: undefined as string | undefined,
  path: undefined as string | undefined,
  isProjectChangedAfterSave: false,
};
const defaultCanvasStore: CanvasStore = {
  canvas: {
    width: 400,
    height: 400,
  },
};
const defaultLayerHistoryStore: LayerHistoryStore = {};
const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  activeLayerId: '',
};

export const initProjectStore = () => {
  const [canvasStore, setCanvasStore] = createStore<CanvasStore>(defaultCanvasStore);
  const [projectStore, setProjectStore] = createStore<ProjectStore>(defaultProjectStore);
  const [layerHistoryStore, setLayerHistoryStore] = createStore<LayerHistoryStore>(defaultLayerHistoryStore);
  const [layerListStore, setLayerListStore] = createStore<LayerListStore>(defaultLayerListStore);

  return {
    canvasStore,
    setCanvasStore,
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

export const layerListStore = projectRootStore.layerListStore;
export const setLayerListStore = projectRootStore.setLayerListStore;

export const layerHistoryStore = projectRootStore.layerHistoryStore;
export const setLayerHistoryStore = projectRootStore.setLayerHistoryStore;

export const projectStore = projectRootStore.projectStore;
export const setProjectStore = projectRootStore.setProjectStore;

export const loadStoreFromProjectJson = async (projectJson: any) => {
  if (projectJson.project) {
    console.log(projectJson.project);
    setProjectStore('name', projectJson.project.name || undefined);
    setProjectStore('path', projectJson.project.path || undefined);
  }

  if (projectJson.canvas) {
    const { width, height } = projectJson.canvas;
    setCanvasStore('canvas', 'width', width);
    setCanvasStore('canvas', 'height', height);
  }

  if (projectJson.images) {
    setLayerHistoryStore({});
    Object.keys(projectJson.images).forEach((id) => {
      const data = projectJson.images[id];
      const agent = resetLayerImage(id, Number(data.dotMagnification || 1));

      agent.setBuffer(data.current);
    });
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
  }
};
