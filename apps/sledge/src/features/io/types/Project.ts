import { ImagePoolEntry } from '~/features/image_pool';
import { CanvasStore, ImagePoolStore, LayerListStore, ProjectStore } from '~/stores/ProjectStores';

interface ProjectBase {
  version?: string; // semver
  projectVersion?: number; // VX
}

export const CURRENT_PROJECT_VERSION = 1;

// <= 0.0.12
export interface ProjectV0 {
  canvasStore: CanvasStore;
  projectStore: ProjectStore;
  layerListStore: LayerListStore;
  imagePoolStore: ImagePoolStore;
  layerBuffers: Map<string, Uint8ClampedArray>;
  imagePool: ImagePoolEntry[];
}
// present
export interface ProjectV1 extends ProjectBase {
  canvas: {
    store: CanvasStore;
  };
  layers: {
    store: LayerListStore;
    buffers: Map<
      string, // layer id
      {
        webpBuffer: Uint8Array; // webp packed buffer
      }
    >;
  };
  project: {
    store: ProjectStore;
  };
  imagePool: {
    store: ImagePoolStore;
    entries: ImagePoolEntry[];
  };
}
