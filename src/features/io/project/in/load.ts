import { getProjectAdapter } from '@sledge-pdm/core';
import { projectHistoryController } from '~/features/history';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore, setSnapshotStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export const loadProject = async (projectObj: any) => {
  const adapter = getProjectAdapter(projectObj);

  if (!adapter) {
    throw new Error('Failed to load project: corrupted or unknown project version');
  }

  // canvas
  const canvasInfo = adapter.getCanvasInfo();
  setCanvasStore('canvas', canvasInfo.size);
  eventBus.emit('canvas:sizeChanged', { newSize: canvasInfo.size });

  // layer
  const layers = adapter.getLayers();
  const layerListState = adapter.getLayerListState();
  setLayerListStore({
    layers,
    ...layerListState,
  });

  // project
  setProjectStore(adapter.getProjectInfo());

  // layer buffer
  allLayers().forEach((layer) => {
    const buffer = adapter.getRawBufferOf(layer.id);
    if (buffer) layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
  });

  // history
  const history = adapter.getHistory();
  if (history && history.undoStack && history.redoStack) {
    projectHistoryController.setSerialized(history.undoStack, history.redoStack);
  }

  // image pool
  const entries = adapter.getImagePoolEntries();
  const imagePoolState = adapter.getImagePoolState();
  setImagePoolStore({
    ...imagePoolState,
    entries,
  });

  // snapshots
  setSnapshotStore('snapshots', adapter.getSnapshots());
};
