import { ReactiveMap } from '@solid-primitives/map';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { Project } from '~/io/project/out/dump';
import { setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';

export const loadProjectJson = (project: Project) => {
  setCanvasStore(project.canvasStore);
  setImagePoolStore('entries', new ReactiveMap(project.imagePoolStore.entries));
  setLayerListStore(project.layerListStore);
  setProjectStore(project.projectStore);
  console.log(project.layerBuffers);

  project.layerListStore.layers.forEach((layer) => {
    // Uncaught (in promise) TypeError: project.layerBuffers?.get is not a function
    // layerBuffers = {}
    resetLayerImage(layer.id, layer.dotMagnification, project.layerBuffers?.get(layer.id) ?? undefined);
  });
};
