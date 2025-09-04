import { replaceAllEntries } from '~/controllers/canvas/image_pool/ImagePoolController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { Project } from '~/io/project/out/dump';
import { setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export const loadProjectJson = (project: Project) => {
  setCanvasStore(project.canvasStore);
  setLayerListStore(project.layerListStore);
  setProjectStore(project.projectStore);
  setImagePoolStore(project.imagePoolStore);

  if (project.imagePool && Array.isArray(project.imagePool)) {
    replaceAllEntries(project.imagePool);
  }

  eventBus.emit('canvas:sizeChanged', { newSize: project.canvasStore.canvas });

  project.layerListStore.layers.forEach((layer) => {
    // Uncaught (in promise) TypeError: project.layerBuffers?.get is not a function
    // layerBuffers = {}
    resetLayerImage(layer.id, layer.dotMagnification, project.layerBuffers?.get(layer.id) ?? undefined);
  });
};
