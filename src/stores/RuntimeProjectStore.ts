import { CanvasInfo, ImagePoolEntry, ImagePoolState, Layer, LayerListState, ProjectInfo, ProjectSnapshot, ProjectV2 } from '@sledge-pdm/core';
import { createStore } from 'solid-js/store';
import { RuntimeProjectSnapshot } from '~/features/snapshot';

export type CurrentProject = ProjectV2;

/**
 * @description Project that projected into SolidJS Store. Do not include props that doesn't use SolidJS Store.
 */
export type RuntimeProject = {
  canvas: CanvasInfo;
  layers: {
    layers: Layer[];
    state: LayerListState;
  };
  imagePool: {
    entries: ImagePoolEntry[];
    state: ImagePoolState;
  };
  project: ProjectInfo;
  snapshots: (ProjectSnapshot | RuntimeProjectSnapshot)[];
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
