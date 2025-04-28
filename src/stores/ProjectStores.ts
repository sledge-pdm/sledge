// projectStore.ts
import { createStore } from 'solid-js/store';
import { Layer } from '~/types/Layer';
import { LayerHistoryStore } from './project/LayerHistoryStore';
import { LayerListStore } from './project/LayerListStore';
import { ProjectStore } from './project/ProjectStore';
import { setCanvasStore } from './project/canvasStore';
import resetLayerImage from '~/controllers/layer/LayerController';
import { decodeImageData } from '~/utils/ImageUtils';

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
  const [layerListStore, setLayerListStore] = createStore<LayerListStore>(defaultLayerListStore);
  const [layerHistoryStore, setLayerHistoryStore] = createStore<LayerHistoryStore>(defaultLayerHistoryStore);
  const [projectStore, setProjectStore] = createStore<ProjectStore>(defaultProjectStore);

  return {
    layerListStore,
    setLayerListStore,
    layerHistoryStore,
    setLayerHistoryStore,
    projectStore,
    setProjectStore,
  };
};

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
      console.log(`read ${id}`);
      const imageData = projectJson.images[id];
      const agent = resetLayerImage(id, Number(imageData.dotMagnification || 1));
      const image = decodeImageData(imageData.current, Number(imageData.width), Number(imageData.height));
      agent.setImage(image);
    });
  }

  if (projectJson.layer && projectJson.layer.layers && Array.isArray(projectJson.layer.layers)) {
    const layers: Layer[] = [];
    projectJson.layer.layers.map((l: any) => {
      layers.push({
        ...l,
        dsl: undefined,
      } as Layer);
    });

    setLayerListStore('layers', layers);
    setLayerListStore('activeLayerId', projectJson.layer.activeLayerId);
  }
};

const projectRootStore = initProjectStore();

export const layerListStore = projectRootStore.layerListStore;
export const setLayerListStore = projectRootStore.setLayerListStore;

export const layerHistoryStore = projectRootStore.layerHistoryStore;
export const setLayerHistoryStore = projectRootStore.setLayerHistoryStore;

export const projectStore = projectRootStore.projectStore;
export const setProjectStore = projectRootStore.setProjectStore;
