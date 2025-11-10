import { webpToRaw } from '@sledge/anvil';
import { projectHistoryController } from '~/features/history';
import { ProjectV0, ProjectV1 } from '~/features/io/types/Project';
import { allLayers } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore, setSnapshotStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export const loadProjectJson = async (project: any) => {
  if (!project.version || !project.projectVersion) {
    // handle as V0 if there's no info
    project = project as ProjectV0;
    loadV0(project);
  } else {
    switch (project.projectVersion) {
      case 0:
      default:
        project = project as ProjectV0;
        loadV0(project);
        break;
      case 1:
        project = project as ProjectV1;
        loadV1(project);
        break;
    }
  }
};

export function loadV0(project: ProjectV0) {
  setCanvasStore(project.canvasStore);
  setLayerListStore(project.layerListStore);
  setProjectStore(project.projectStore);
  setProjectStore('loadProjectVersion', {
    sledge: undefined,
    project: 0,
  });
  setImagePoolStore(project.imagePoolStore);

  if (project.imagePool && Array.isArray(project.imagePool)) {
    setImagePoolStore('entries', project.imagePool);
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
}

export function loadV1(project: ProjectV1) {
  if (project.canvas) setCanvasStore(project.canvas.store);
  if (project.layers) setLayerListStore(project.layers.store);
  if (project.project) setProjectStore(project.project.store);
  setProjectStore('loadProjectVersion', {
    sledge: project.version ?? undefined,
    project: 1,
  });
  if (project.imagePool) setImagePoolStore(project.imagePool.store);
  if (project.snapshots) setSnapshotStore(project.snapshots.store);

  const canvasSize = canvasStore.canvas;
  eventBus.emit('canvas:sizeChanged', { newSize: canvasSize });

  allLayers().forEach((layer) => {
    const data = project.layers.buffers.get(layer.id);
    if (!data) return;

    const { webpBuffer } = data;
    if (webpBuffer) {
      const buffer = webpToRaw(webpBuffer, canvasSize.width, canvasSize.height);
      anvilManager.registerAnvil(layer.id, new Uint8ClampedArray(buffer.buffer), canvasSize.width, canvasSize.height);
    } else {
      const newBuffer = new Uint8ClampedArray(canvasSize.width * canvasSize.height * 4);
      anvilManager.registerAnvil(layer.id, newBuffer, canvasSize.width, canvasSize.height);
    }
  });

  if (project.history && project.history.undoStack && project.history.redoStack) {
    projectHistoryController.setSerialized(project.history.undoStack, project.history.redoStack);
  }
}
