import { projectHistoryController } from '~/features/history';
import { ProjectV1 } from '~/features/io/types/Project';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, imagePoolStore, layerListStore, projectStore, snapshotStore } from '~/stores/ProjectStores';
import { packr } from '~/utils/msgpackr';
import { getCurrentVersion } from '~/utils/VersionUtils';

export const dumpProject = async (): Promise<Uint8Array> => {
  const project = await dumpProjectJson();
  const packed = packr.pack(project);
  return packed instanceof Uint8Array ? packed : Uint8Array.of(packed);
};

export const dumpProjectJson = async (): Promise<ProjectV1> => {
  const buffers = new Map<
    string,
    {
      webpBuffer: Uint8Array;
    }
  >();
  const size = canvasStore.canvas;
  allLayers().forEach((l) => {
    const anvil = getAnvilOf(l.id);
    const webp = anvil!.exportWebp();
    buffers.set(l.id, {
      webpBuffer: webp,
    });
  });
  const project: ProjectV1 = {
    version: await getCurrentVersion(),
    projectVersion: 1,
    canvas: {
      store: { ...canvasStore },
    },
    project: {
      store: { ...projectStore },
    },
    imagePool: {
      store: { ...imagePoolStore },
    },
    history: projectHistoryController.getSerialized(),
    layers: {
      store: { ...layerListStore },
      buffers: buffers,
    },
    snapshots: {
      store: { ...snapshotStore },
    },
  };

  return project;
};
