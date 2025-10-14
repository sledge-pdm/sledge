import { rawToWebp } from '@sledge/anvil';
import { getEntries } from '~/features/image_pool';
import { ProjectV1 } from '~/features/io/types/Project';
import { allLayers } from '~/features/layer';
import { getBufferPointer } from '~/features/layer/anvil/AnvilController';
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
    const buf = getBufferPointer(l.id) ?? new Uint8Array(size.width * size.height * 4);
    buffers.set(l.id, {
      webpBuffer: rawToWebp(new Uint8Array(buf.buffer), canvasStore.canvas.width, canvasStore.canvas.height),
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
      entries: getEntries(),
    },
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
