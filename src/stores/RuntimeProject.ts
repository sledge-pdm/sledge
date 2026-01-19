import { getProjectAdapter, gzipDeflate, ProjectV2 } from '@sledge-pdm/core';
import { createStore } from 'solid-js/store';
import { projectHistoryController } from '~/features/history';
import { ImagePoolImage, ImagePoolImagePersisted } from '~/features/image_pool';
import { makeRuntimeImages, toPersistedImages } from '~/features/image_pool/service';
import { allLayers, Layer } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { getCurrentVersion } from '~/utils/VersionUtils';

type Project = ProjectV2;

/**
 * @description Project that projected into SolidJS Store. Do not include props that doesn't use SolidJS Store.
 */
export type RuntimeProject = {
  canvas: Project['canvas'];
  layers: Omit<Project['layers'], 'buffers'>;
  imagePool: Pick<Project['imagePool'], 'entries' | 'state'>;
  // history: Project['history'];
  project: Project['project'];
  snapshots: Project['snapshots']; // TODO: change on-memory structure (refer todo.md)
};

const runtimeProjectBeforeInit: RuntimeProject = {
  canvas: {
    size: {
      width: 1024,
      height: 1024,
    },
  },
  layers: {
    layers: new Array<Layer>(),
    state: {
      activeLayerId: '',
      selectionEnabled: false,
      selected: new Set<string>(),
      isImagePoolActive: true,
      baseLayer: {
        colorMode: 'transparent',
      },
    },
  },
  project: {
    thumbnailPath: undefined as string | undefined,
    lastSavedPath: undefined,
    lastSavedAt: undefined as Date | undefined,

    autoSnapshotEnabled: false,
    autoSnapshotInterval: 60,
  },
  snapshots: [],
  imagePool: {
    entries: [],
    // images: new Map(), move to local store?
    state: {
      selectedEntryId: undefined,
      preserveAspectRatio: true,
    },
  },
};

export const [projectStore, setProjectStore] = createStore<RuntimeProject>(runtimeProjectBeforeInit);

const [imagePoolStore, setImagePoolStore] = createStore<{
  images: Map<string, ImagePoolImage>;
}>({
  images: new Map<string, ImagePoolImage>(),
});

export function initRuntimeProject(project: Project) {
  // things which is not included in RuntimeProject
  const adapter = getProjectAdapter(project);

  if (!adapter) {
    throw new Error('Failed to load project to runtime');
  }

  const canvasInfo = adapter.getCanvasInfo();
  adapter.getLayers().forEach((layer) => {
    let buffer = adapter.getRawBufferOf(layer.id);
    if (!buffer) {
      buffer = new Uint8ClampedArray(canvasInfo.size.width * canvasInfo.size.height * 4);
    }
    layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
  });

  const history = adapter.getHistory();
  if (history && history.undoStack && history.redoStack) {
    projectHistoryController.setSerialized(history.undoStack, history.redoStack);
  }

  const entries = adapter.getImagePoolEntries();
  // const imagePoolState = adapter.getImagePoolState();
  imagePoolStore.images.forEach((image) => URL.revokeObjectURL(image.blobUrl));
  const persistedImages = new Map<string, ImagePoolImagePersisted>();
  entries.forEach((entry) => {
    const image = adapter.getImagePoolImageOf(entry.id);
    if (image) persistedImages.set(entry.id, image);
  });
  setImagePoolStore({
    images: makeRuntimeImages(persistedImages),
  });

  // TODO: convert snapshots into lightweight runtime structures

  // set runtime project
  const { buffers, ...layers } = project.layers;
  const { images, ...imagePool } = project.imagePool; // images は別途 makeRuntimeImages などで復元する
  const { history: historyDispose, version, projectVersion, ...rest } = project;
  const runtime: RuntimeProject = { ...rest, layers, imagePool };
  setProjectStore(runtime);
}

/**
 *  @description Get project data for files with current runtime state
 */
export async function getProjectFromRuntime(): Promise<Project> {
  const buffers = new Map<
    string, // layer id
    {
      deflatedBuffer: Uint8Array; // deflate compressed buffer
    }
  >();
  const size = projectStore.canvas.size;
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

  const serializedHistory = projectHistoryController.getSerialized();

  const project: Project = {
    version: await getCurrentVersion(),
    projectVersion: 2,
    ...{ ...projectStore },
    history: serializedHistory,
    layers: {
      buffers,
      layers: projectStore.layers.layers,
      state: projectStore.layers.state,
    },
    imagePool: { images: toPersistedImages(imagePoolStore.images), ...projectStore.imagePool },
  };

  return project;
}
