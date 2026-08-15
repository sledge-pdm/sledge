import { getProjectAdapter, gzipInflate, ImagePoolImage, ProjectBase } from '@sledge-pdm/core';
import type { HistoryRawSnapshot } from '@sledge-pdm/frasco';
import { unwrap } from 'solid-js/store';
import { historyManager } from '~/features/history';
import { inflateHistoryStacks, serializeHistoryStacks } from '~/features/history/serialization';
import { clearImagePoolBlobUrls } from '~/features/image_pool/blobManager';
import { imagePoolImages, setImagePoolImages } from '~/features/image_pool/imageStore';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { allLayers } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { selectionManager } from '~/features/selection/SelectionManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { getAllFullSnapshots, RuntimeProjectSnapshot } from '~/features/snapshot';
import { deflateAllAsync } from '~/utils/Compression';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { setIOStore } from './EditorStores';
import { CurrentProject, projectStore, RuntimeProject, setProjectStore } from './RuntimeProjectStore';

export const normalizeLayerSelection = (selected: unknown): Set<string> => {
  if (selected instanceof Set) {
    return new Set(Array.from(selected).filter((id): id is string => typeof id === 'string'));
  }

  if (Array.isArray(selected)) {
    return new Set(selected.filter((id): id is string => typeof id === 'string'));
  }

  return new Set<string>();
};

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
  selectionManager.resize(canvasInfo.size);

  const layers = adapter.getLayers() ?? [];
  await Promise.all(
    layers.map(async (layer) => {
      let buffer = await adapter.getRawBufferOf(layer.id);
      if (!buffer) {
        buffer = new Uint8ClampedArray(canvasInfo.size.width * canvasInfo.size.height * 4);
      }
      layerManager.registerLayer(layer.id, buffer, canvasInfo.size.width, canvasInfo.size.height, { inputSpace: 'canvas' });
    })
  );

  const selection = adapter.getSelection();
  if (selection && selection.mask) {
    selectionManager.setBack(new SelectionMask(canvasInfo.size.width, canvasInfo.size.height, selection.mask));
  }

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

  const runtimeSnapshots = (await adapter.getSnapshots()).map((fullSnapshot) => {
    const { project, ...runtime } = fullSnapshot;
    return runtime as RuntimeProjectSnapshot;
  });
  const layerListState = adapter.getLayerListState();

  // set runtime project
  const runtime: RuntimeProject = {
    canvas: adapter.getCanvasInfo(),
    imagePool: {
      entries: adapter.getImagePoolEntries() ?? [],
      state: adapter.getImagePoolState(),
    },
    layers: {
      layers: adapter.getLayers() ?? [],
      state: {
        ...layerListState,
        selected: normalizeLayerSelection(layerListState.selected),
      },
    },
    project: adapter.getProjectInfo(),
    snapshots: runtimeSnapshots ?? [],
  };

  setProjectStore(runtime);
}

export interface GetProjectFromRuntimeOptions {
  /**
   * @description restore snapshot bodies from the saved file (default: true).
   *   pass false when the caller discards snapshots anyway - restoring them reads and unpacks the whole project file.
   */
  includeSnapshots?: boolean;
}

/**
 *  @description Get project data for files with current runtime state
 */
export async function getProjectFromRuntime(options?: GetProjectFromRuntimeOptions): Promise<CurrentProject> {
  const buffers = new Map<
    string, // layer id
    {
      deflatedBuffer: Uint8Array; // deflate compressed buffer
    }
  >();
  const size = projectStore.canvas.size;
  const layers = allLayers();
  // read back on demand: deflateAllAsync only asks for a layer when it is about to compress it.
  const deflatedBuffers = await deflateAllAsync(
    layers.map((l) => () => {
      try {
        return layerManager.exportRawCanvas(l.id);
      } catch {
        return new Uint8ClampedArray(size.width * size.height * 4);
      }
    })
  );
  layers.forEach((l, i) => {
    buffers.set(l.id, {
      deflatedBuffer: deflatedBuffers[i],
    });
  });

  const selectionMask = selectionManager.getBack();

  const serializedHistory = serializeHistoryStacks(historyManager.getUndoStack(), historyManager.getRedoStack());
  const layerHistories: Record<string, { undoStack: PackedHistorySnapshot[]; redoStack: PackedHistorySnapshot[] }> = {};
  for (const l of layers) {
    const layer = layerManager.getLayerOptional(l.id);
    if (!layer) continue;
    const raw = layer.exportHistoryRaw();
    if (!raw) continue;

    layerHistories[l.id] = {
      undoStack: await deflateLayerHistory(raw.undoStack),
      redoStack: await deflateLayerHistory(raw.redoStack),
    };
  }

  const runtimeSnapshots = options?.includeSnapshots === false ? [] : await getAllFullSnapshots();

  // snapshots are replaced below, and cloning them would duplicate every buffer they hold. clone the rest.
  const { snapshots: _snapshots, ...storeWithoutSnapshots } = unwrap(projectStore);
  const clonedProjectStore = structuredClone(storeWithoutSnapshots);
  const project: CurrentProject = {
    version: await getCurrentVersion(),
    projectVersion: CURRENT_PROJECT_VERSION,
    ...clonedProjectStore,

    history: { ...(serializedHistory as unknown as CurrentProject['history']), layerHistories },
    layers: {
      buffers,
      layers: clonedProjectStore.layers.layers,
      state: clonedProjectStore.layers.state,
    },
    selection: {
      mask: selectionMask?.getMask(),
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

async function deflateLayerHistory(stacks: HistoryRawSnapshot[]): Promise<PackedHistorySnapshot[]> {
  const deflated = await deflateAllAsync(stacks.map((snapshot) => () => snapshot.buffer));
  return stacks.map((snapshot, i) => ({
    bounds: snapshot.bounds,
    size: snapshot.size,
    deflated: deflated[i],
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
