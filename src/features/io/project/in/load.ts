import { getProjectAdapter } from '@sledge-pdm/core';
import { projectHistoryController } from '~/features/history';
import { ImagePoolImagePersisted } from '~/features/image_pool';
import { makeRuntimeImages } from '~/features/image_pool/service';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn, logUserWarn } from '~/features/log';
import { setIOStore } from '~/stores/EditorStores';
import { imagePoolStore, setImagePoolStore, setProjectStoreFormer, setSnapshotStore } from '~/stores/ProjectStores';
import { initRuntimeProject, setProjectStore } from '~/stores/RuntimeProject';
import { eventBus } from '~/utils/EventBus';
import { updateWebGLCanvas } from '~/webgl/service';

export async function loadProject(projectObj: any): Promise<void> {
  initRuntimeProject(projectObj);

  const adapter = getProjectAdapter(projectObj);

  if (!adapter) {
    throw new Error('Failed to load project: corrupted or unknown project version');
  }

  const failedParts: string[] = [];

  // versions
  const versions = adapter.getVersions();
  setIOStore('loadProjectVersion', { sledge: versions.sledge ?? undefined, project: versions.project ?? undefined });

  // canvas
  try {
    const canvasInfo = adapter.getCanvasInfo();
    setProjectStore('canvas', 'size', canvasInfo.size);
    eventBus.emit('canvas:sizeChanged', { newSize: canvasInfo.size });
  } catch (e) {
    logSystemWarn(`loadProject: failed in canvas ${String(e)}`);
    failedParts.push('canvas');
  }

  // layers
  try {
    const layers = adapter.getLayers();
    const layerListState = adapter.getLayerListState();
    setProjectStore('layers', {
      layers,
      ...layerListState,
    });
    const canvasInfo = adapter.getCanvasInfo();
    layers.forEach((layer) => {
      let buffer = adapter.getRawBufferOf(layer.id);
      if (!buffer) {
        logSystemWarn(`loadProject: failed in layer ${layer.id} layer exists but layer not set`);
        buffer = new Uint8ClampedArray(canvasInfo.size.width * canvasInfo.size.height * 4);
        failedParts.push(`layer[${layer.id}]`);
      }

      layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
    });
  } catch (e) {
    logSystemWarn(`loadProject: failed in layers ${String(e)}`);
    failedParts.push('layers');
  }

  // project
  try {
    setProjectStoreFormer(adapter.getProjectInfo());
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
    imagePoolStore.images.forEach((image) => URL.revokeObjectURL(image.blobUrl));
    const images = new Map<string, ImagePoolImagePersisted>();
    entries.forEach((entry) => {
      const image = adapter.getImagePoolImageOf(entry.id);
      if (image) {
        images.set(entry.id, image);
      } else {
        logSystemWarn(`loadProject: imagePool image missing for entry ${entry.id}`);
      }
    });

    setImagePoolStore({
      selectedEntryId: imagePoolState.selectedEntryId,
      preserveAspectRatio: imagePoolState.preserveAspectRatio,
      entries,
      images: makeRuntimeImages(images),
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
  } else {
    updateWebGLCanvas('Project Load');
  }
}
