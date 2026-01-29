import { getProjectAdapter, gzipDeflate, gzipInflate, ProjectBase } from '@sledge-pdm/core';
import type { HistoryRawSnapshot } from '@sledge-pdm/frasco';
import { unwrap } from 'solid-js/store';
import { historyManager } from '~/features/history';
import { inflateHistoryStacks, serializeHistoryStacks } from '~/features/history/serialization';
import { ImagePoolImage } from '~/features/image_pool';
import { clearImagePoolBlobUrls } from '~/features/image_pool/blobManager';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { getAllFullSnapshots, RuntimeProjectSnapshot } from '~/features/snapshot';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { setIOStore } from './EditorStores';
import { CurrentProject, projectStore, RuntimeProject, setProjectStore } from './RuntimeProjectStore';

export async function initRuntimeProject(project: ProjectBase) {
  // things which is not included in RuntimeProject
  const adapter = getProjectAdapter(project);

  if (!adapter) {
    throw new Error('Failed to load project to runtime');
  }

  historyManager.clearHistory();

  const versions = adapter.getVersions();
  setIOStore('loadProjectVersion', { sledge: versions?.sledge ?? undefined, project: versions?.project ?? undefined });

  const canvasInfo = adapter.getCanvasInfo();
  selectionManager.resizeSelectionMask(canvasInfo.size);

  const layers = adapter.getLayers() ?? [];
  Promise.all(
    layers.map(async (layer) => {
      let buffer = await adapter.getRawBufferOf(layer.id);
      if (!buffer) {
        buffer = new Uint8ClampedArray(canvasInfo.size.width * canvasInfo.size.height * 4);
      }
      layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
    })
  );

  const history = adapter.getHistory();
  if (history?.undoStack && history?.redoStack) {
    const inflated = inflateHistoryStacks({ undoStack: history.undoStack, redoStack: history.redoStack });
    historyManager.setStacks(inflated.undo, inflated.redo, { emit: true, markDirty: false });
  }
  if (history?.layerHistories) {
    for (const [layerId, stacks] of Object.entries(history.layerHistories)) {
      layerManager.importHistoryRaw(layerId, inflateLayerHistory(stacks.undoStack ?? []), inflateLayerHistory(stacks.redoStack ?? []));
    }
  }

  const entries = adapter.getImagePoolEntries();
  // const imagePoolState = adapter.getImagePoolState();
  clearImagePoolBlobUrls();
  const persistedImages = new Map<string, ImagePoolImage>();
  entries.forEach((entry) => {
    const image = adapter.getImagePoolImageOf(entry.id);
    if (image) persistedImages.set(entry.id, image);
  });
  setImagePoolImages(persistedImages);

  // TODO: convert snapshots into lightweight runtime structures
  const runtimeSnapshots = (await adapter.getSnapshots()).map((fullSnapshot) => {
    const { project, ...runtime } = fullSnapshot;
    return runtime as RuntimeProjectSnapshot;
  });

  // set runtime project
  const runtime: RuntimeProject = {
    canvas: adapter.getCanvasInfo(),
    imagePool: {
      entries: adapter.getImagePoolEntries() ?? [],
      state: adapter.getImagePoolState(),
    },
    layers: {
      layers: adapter.getLayers() ?? [],
      state: adapter.getLayerListState(),
    },
    project: adapter.getProjectInfo(),
    snapshots: runtimeSnapshots ?? [],
  };

  setProjectStore(runtime);
}

/**
 *  @description Get project data for files with current runtime state
 */
export async function getProjectFromRuntime(): Promise<CurrentProject> {
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

  const serializedHistory = serializeHistoryStacks(historyManager.getUndoStack(), historyManager.getRedoStack());
  const layerHistories: Record<string, { undoStack: PackedHistorySnapshot[]; redoStack: PackedHistorySnapshot[] }> = {};
  allLayers().forEach((l) => {
    const layer = layerManager.getLayerOptional(l.id);
    if (!layer) return;
    const raw = layer.exportHistoryRaw();
    if (!raw) return;

    layerHistories[l.id] = {
      undoStack: deflateLayerHistory(raw.undoStack),
      redoStack: deflateLayerHistory(raw.redoStack),
    };
  });

  const runtimeSnapshots = await getAllFullSnapshots();

  const clonedProjectStore = structuredClone(unwrap(projectStore));
  const project: CurrentProject = {
    version: await getCurrentVersion(),
    projectVersion: CURRENT_PROJECT_VERSION,
    ...{ ...clonedProjectStore },

    history: { ...(serializedHistory as unknown as CurrentProject['history']), layerHistories },
    layers: {
      buffers,
      layers: clonedProjectStore.layers.layers,
      state: clonedProjectStore.layers.state,
    },
    imagePool: { images: new Map(imagePoolImages()), ...clonedProjectStore.imagePool },
    snapshots: runtimeSnapshots,
  };

  return project;
}

type PackedHistorySnapshot = {
  bounds: { x: number; y: number; width: number; height: number };
  size: { width: number; height: number };
  deflated: Uint8Array;
  fullLayer?: boolean;
};

function deflateLayerHistory(stacks: HistoryRawSnapshot[]): PackedHistorySnapshot[] {
  return stacks.map((snapshot) => ({
    bounds: snapshot.bounds,
    size: snapshot.size,
    deflated: gzipDeflate(snapshot.buffer),
    fullLayer: snapshot.fullLayer,
  }));
}

function inflateLayerHistory(stacks: PackedHistorySnapshot[]): HistoryRawSnapshot[] {
  return stacks.map((snapshot) => ({
    bounds: snapshot.bounds,
    size: snapshot.size,
    buffer: gzipInflate(snapshot.deflated),
    fullLayer: snapshot.fullLayer,
  }));
}
