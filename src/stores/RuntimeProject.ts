import { getProjectAdapter, ImagePoolImage, ProjectBase } from '@sledge-pdm/core';
import type { HistoryPackedSnapshot } from '@sledge-pdm/frasco';
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
      // hand the stored bytes over as they are - frasco keeps them, so the next save skips these snapshots.
      layerManager.importHistoryPacked(layerId, stacks.undoStack ?? [], stacks.redoStack ?? []);
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
  const size = projectStore.canvas.size;
  const layers = allLayers();
  const bufferCache = layerManager.bufferCache;

  // layers that have not been touched since the last save keep the bytes produced back then. take those
  // bytes now rather than after the compressions below: an edit landing mid-save drops the cache entry,
  // and re-reading it then would leave the layer out of the file entirely.
  const deflatedByLayer = new Map<string, Uint8Array>();
  const staleLayerIds: string[] = [];
  for (const l of layers) {
    const cached = bufferCache.get(l.id);
    if (cached) deflatedByLayer.set(l.id, cached);
    else staleLayerIds.push(l.id);
  }

  // read back on demand: deflateAllAsync only asks for a layer when it is about to compress it.
  const captureTokens = new Array<number>(staleLayerIds.length);
  const deflatedStale = await deflateAllAsync(
    staleLayerIds.map((layerId, i) => () => {
      // token taken right before the read, so an edit arriving during the compression voids this result.
      captureTokens[i] = bufferCache.beginCapture(layerId);
      try {
        return layerManager.exportRawCanvas(layerId);
      } catch {
        return new Uint8ClampedArray(size.width * size.height * 4);
      }
    })
  );
  staleLayerIds.forEach((layerId, i) => {
    bufferCache.commit(layerId, captureTokens[i], deflatedStale[i]);
    deflatedByLayer.set(layerId, deflatedStale[i]);
  });

  const buffers = new Map<
    string, // layer id
    {
      deflatedBuffer: Uint8Array; // deflate compressed buffer
    }
  >();
  for (const l of layers) {
    const deflatedBuffer = deflatedByLayer.get(l.id);
    if (deflatedBuffer) buffers.set(l.id, { deflatedBuffer });
  }

  const selectionMask = selectionManager.getBack();

  const serializedHistory = serializeHistoryStacks(historyManager.getUndoStack(), historyManager.getRedoStack());
  const layerHistories: Record<string, { undoStack: HistoryPackedSnapshot[]; redoStack: HistoryPackedSnapshot[] }> = {};
  for (const l of layers) {
    const layer = layerManager.getLayerOptional(l.id);
    if (!layer) continue;
    // frasco hands back the deflate it already holds for each snapshot and only reads one off the GPU when
    // it has none, so snapshots that survived the previous save cost nothing here.
    const packed = await layer.exportHistoryPacked();
    if (!packed) continue;

    layerHistories[l.id] = packed;
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
