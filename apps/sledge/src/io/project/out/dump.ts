import { getEntries, ImagePoolEntry } from '~/features/image_pool';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import {
  CanvasStore,
  canvasStore,
  imagePoolStore,
  ImagePoolStore,
  LayerListStore,
  layerListStore,
  ProjectStore,
  projectStore,
} from '~/stores/ProjectStores';
import { packr } from '~/utils/msgpackr';

export interface Project {
  canvasStore: CanvasStore;
  projectStore: ProjectStore;
  layerListStore: LayerListStore;
  imagePoolStore: ImagePoolStore;
  layerBuffers: Map<string, Uint8ClampedArray>;
  imagePool: ImagePoolEntry[];
}

export function getLayerBuffers(): Map<string, Uint8ClampedArray> {
  const map = new Map<string, Uint8ClampedArray>();
  allLayers().forEach((layer) => {
    map.set(layer.id, getAnvilOf(layer.id)!.getImageData());
  });
  return map;
}

export const dumpProject = async (): Promise<Uint8Array> => {
  const project: Project = {
    canvasStore: canvasStore,
    projectStore: projectStore,
    layerListStore: layerListStore,
    imagePoolStore: imagePoolStore,
    layerBuffers: getLayerBuffers(),
    imagePool: getEntries(),
  };
  const packed = packr.pack(project);
  return packed instanceof Uint8Array ? packed : Uint8Array.of(packed);
};
