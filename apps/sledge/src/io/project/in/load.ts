import { replaceAllEntries } from '~/features/image_pool';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
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

  const canvasSize = project.canvasStore.canvas;
  project.layerListStore.layers.forEach((layer) => {
    const buffer = project.layerBuffers?.get(layer.id);
    if (buffer) {
      anvilManager.registerAnvil(layer.id, buffer, project.canvasStore.canvas.width, project.canvasStore.canvas.height);
    } else {
      const newBuffer = new Uint8ClampedArray(canvasSize.width * canvasSize.height * 4);
      anvilManager.registerAnvil(layer.id, newBuffer, project.canvasStore.canvas.width, project.canvasStore.canvas.height);
    }
  });
};
