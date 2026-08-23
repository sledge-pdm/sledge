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

/** @description the parts of assembling a project that take long enough to be worth reporting. */
export type ProjectAssemblyPhase = 'layers' | 'history' | 'snapshots';

export interface GetProjectFromRuntimeOptions {
  /**
   * @description restore snapshot bodies from the saved file (default: true).
   *   pass false when the caller discards snapshots anyway - restoring them reads and unpacks the whole project file.
   */
  includeSnapshots?: boolean;
  /**
   * @description abort the assembly. checked between layers and between history stacks, so a cancel takes
   *   effect within one buffer rather than at the end.
   */
  signal?: AbortSignal;
  /** @description progress within each phase. left out by callers that are not user-visible work. */
  onProgress?: (phase: ProjectAssemblyPhase, done: number, total: number) => void;
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

  // cached layers cost nothing, so progress is reported over the ones actually being compressed.
  options?.onProgress?.('layers', 0, staleLayerIds.length);

  // read back on demand: deflateAllAsync only asks for a layer when it is about to compress it.
  const captureTokens = new Array<number>(staleLayerIds.length);
  const deflatedStale = await deflateAllAsync(
    staleLayerIds.map((layerId, i) => async () => {
      // token taken right before the read, so an edit arriving during the compression voids this result.
      captureTokens[i] = bufferCache.beginCapture(layerId);
      try {
        return await layerManager.exportRawCanvasAsync(layerId);
      } catch {
        return new Uint8ClampedArray(size.width * size.height * 4);
      }
    }),
    {
      signal: options?.signal,
      onEach: (done, total) => options?.onProgress?.('layers', done, total),
    }
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
  options?.onProgress?.('history', 0, layers.length);
  for (const [index, l] of layers.entries()) {
    options?.signal?.throwIfAborted();
    const layer = layerManager.getLayerOptional(l.id);
    // frasco hands back the deflate it already holds for each snapshot and only reads one off the GPU when
    // it has none, so snapshots that survived the previous save cost nothing here.
    const packed = await layer?.exportHistoryPacked();
    if (packed) layerHistories[l.id] = packed;
    options?.onProgress?.('history', index + 1, layers.length);
  }

  // restoring snapshot bodies reads and unpacks the whole saved file: one long step with nothing to report
  // from inside it. check the signal on both sides so a cancel neither has to sit through it nor through
  // the pack that follows.
  options?.signal?.throwIfAborted();
  options?.onProgress?.('snapshots', 0, 1);
  const runtimeSnapshots = options?.includeSnapshots === false ? [] : await getAllFullSnapshots();
  options?.onProgress?.('snapshots', 1, 1);
  options?.signal?.throwIfAborted();

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
