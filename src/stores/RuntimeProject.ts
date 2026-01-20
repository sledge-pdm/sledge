import { getProjectAdapter, gzipDeflate, gzipInflate, ProjectBase } from '@sledge-pdm/core';
import type { HistoryRawSnapshot } from '@sledge-pdm/frasco';
import { HistoryStacks } from 'node_modules/@sledge-pdm/core/dist/src/project/adapters/parts/History';
import { projectHistoryController } from '~/features/history';
import { ImagePoolImagePersisted } from '~/features/image_pool';
import { makeRuntimeImages, runtimeImages, setRuntimeImages, toPersistedImages } from '~/features/image_pool/service';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { setIOStore } from './EditorStores';
import { CurrentProject, projectStore, RuntimeProject, setProjectStore } from './RuntimeProjectStore';

export function initRuntimeProject(project: ProjectBase) {
  // things which is not included in RuntimeProject
  const adapter = getProjectAdapter(project);

  if (!adapter) {
    throw new Error('Failed to load project to runtime');
  }

  const versions = adapter.getVersions();
  setIOStore('loadProjectVersion', { sledge: versions.sledge ?? undefined, project: versions.project ?? undefined });

  const canvasInfo = adapter.getCanvasInfo();

  const layers = adapter.getLayers() ?? [];
  layers.forEach((layer) => {
    let buffer = adapter.getRawBufferOf(layer.id);
    if (!buffer) {
      buffer = new Uint8ClampedArray(canvasInfo.size.width * canvasInfo.size.height * 4);
    }
    layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
  });

  let history: HistoryStacks | null = adapter.getHistory();
  if (history.undoStack && history.redoStack) {
    projectHistoryController.setSerialized(history.undoStack, history.redoStack);
  }
  if (history.layerHistories) {
    for (const [layerId, stacks] of Object.entries(history.layerHistories)) {
      layerManager.importHistoryRaw(layerId, inflateLayerHistory(stacks.undoStack ?? []), inflateLayerHistory(stacks.redoStack ?? []));
    }
  }

  const entries = adapter.getImagePoolEntries();
  // const imagePoolState = adapter.getImagePoolState();
  const existingRuntimeImages = runtimeImages() ?? [];
  existingRuntimeImages.forEach((image) => URL.revokeObjectURL(image.blobUrl));
  const persistedImages = new Map<string, ImagePoolImagePersisted>();
  entries.forEach((entry) => {
    const image = adapter.getImagePoolImageOf(entry.id);
    if (image) persistedImages.set(entry.id, image);
  });
  setRuntimeImages(makeRuntimeImages(persistedImages));

  // TODO: convert snapshots into lightweight runtime structures

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
    snapshots: adapter.getSnapshots() ?? [],
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

  const serializedHistory = projectHistoryController.getSerialized();
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

  const project: CurrentProject = {
    version: await getCurrentVersion(),
    projectVersion: CURRENT_PROJECT_VERSION,
    ...{ ...projectStore },

    history: { ...serializedHistory, layerHistories },
    layers: {
      buffers,
      layers: projectStore.layers.layers,
      state: projectStore.layers.state,
    },
    imagePool: { images: toPersistedImages(runtimeImages()), ...projectStore.imagePool },
  };
  project.history.layerHistories = layerHistories;

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
