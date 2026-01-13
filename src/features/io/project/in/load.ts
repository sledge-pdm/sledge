import { getProjectAdapter } from '@sledge-pdm/core';
import { projectHistoryController } from '~/features/history';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn, logUserWarn } from '~/features/log';
import { setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore, setSnapshotStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export async function loadProject(projectObj: any): Promise<void> {
  const adapter = getProjectAdapter(projectObj);

  if (!adapter) {
    throw new Error('Failed to load project: corrupted or unknown project version');
  }

  const failedParts: string[] = [];

  // canvas
  try {
    const canvasInfo = adapter.getCanvasInfo();
    setCanvasStore('size', canvasInfo.size);
    eventBus.emit('canvas:sizeChanged', { newSize: canvasInfo.size });
  } catch (e) {
    logSystemWarn(`loadProject: failed in canvas ${String(e)}`);
    failedParts.push('canvas');
  }

  // layers
  try {
    const layers = adapter.getLayers();
    const layerListState = adapter.getLayerListState();
    setLayerListStore({
      layers,
      ...layerListState,
    });
    const canvasInfo = adapter.getCanvasInfo();
    layers.forEach((layer) => {
      const buffer = adapter.getRawBufferOf(layer.id);
      if (buffer) layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
    });
  } catch (e) {
    logSystemWarn(`loadProject: failed in layers ${String(e)}`);
    failedParts.push('layers');
  }

  // project
  try {
    setProjectStore(adapter.getProjectInfo());
  } catch (e) {
    logSystemWarn(`loadProject: failed in project ${String(e)}`);
    failedParts.push('project');
  }

  // history
  try {
    const history = adapter.getHistory();
    if (history && history.undoStack && history.redoStack) {
      projectHistoryController.setSerialized(history.undoStack, history.redoStack);
    }
  } catch (e) {
    logSystemWarn(`loadProject: failed in history ${String(e)}`);
    failedParts.push('history');
  }

  // image pool
  try {
    const entries = adapter.getImagePoolEntries();
    const imagePoolState = adapter.getImagePoolState();
    setImagePoolStore({
      ...imagePoolState,
      entries,
    });
  } catch (e) {
    logSystemWarn(`loadProject: failed in image pool ${String(e)}`);
    failedParts.push('image pool');
  }

  // snapshots
  try {
    setSnapshotStore('snapshots', adapter.getSnapshots());
  } catch (e) {
    logSystemWarn(`loadProject: failed in snapshots ${String(e)}`);
    failedParts.push('snapshots');
  }

  if (failedParts.length > 0) {
    logUserWarn('Some parts are not loaded in error: ' + failedParts.join(', ') + "\nDO NOT SAVE PROJECT IF THIS ISN'T AN INTENTIONAL ERROR!!");
  }
}
