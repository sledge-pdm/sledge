import { gzipDeflate, ProjectV2 } from '@sledge-pdm/core';
import { projectHistoryController } from '~/features/history';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { canvasStore, imagePoolStore, layerListStore, projectStore, snapshotStore } from '~/stores/ProjectStores';
import { packr } from '~/utils/msgpackr';
import { getCurrentVersion } from '~/utils/VersionUtils';

export const dumpProject = async (): Promise<Uint8Array> => {
  const project = await dumpProjectJson();
  const packed = packr.pack(project);
  return packed instanceof Uint8Array ? packed : Uint8Array.of(packed);
};

export const dumpProjectJson = async (): Promise<ProjectV2> => {
  const buffers = new Map<
    string, // layer id
    {
      deflatedBuffer: Uint8Array; // deflate compressed buffer
    }
  >();
  const size = canvasStore.canvas;
  allLayers().forEach((l) => {
    let buffer: Uint8ClampedArray;
    try {
      buffer = layerManager.exportRawCanvas(l.id);
    } catch {
      buffer = new Uint8ClampedArray(size.width * size.height * 4);
    }
    const deflated = gzipDeflate(buffer);
    buffers.set(l.id, {
      deflatedBuffer: deflated,
    });
  });
  const project: ProjectV2 = {
    version: await getCurrentVersion(),
    projectVersion: 2,
    canvas: {
      store: { canvas: { ...canvasStore.canvas } },
    },
    project: {
      store: { ...projectStore, loadProjectVersion: projectStore.loadProjectVersion ? { ...projectStore.loadProjectVersion } : undefined },
    },
    imagePool: {
      store: { ...imagePoolStore },
    },
    history: projectHistoryController.getSerialized(),
    layers: {
      store: { ...layerListStore },
      buffers: buffers,
    },
    snapshots: snapshotStore.snapshots,
  };

  return project;
};
