import { ReactiveMap } from '@solid-primitives/map';
import { Packr } from 'msgpackr';
import { getBufferOf } from '~/controllers/layer/LayerAgentManager';
import { allLayers } from '~/controllers/layer/LayerListController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { CanvasStore, canvasStore, imagePoolStore, LayerListStore, layerListStore, ProjectStore, projectStore } from '~/stores/ProjectStores';

export interface Project {
  canvasStore: CanvasStore;
  projectStore: ProjectStore;
  imagePoolStore: {
    entries: Map<string, ImagePoolEntry> | ReactiveMap<string, ImagePoolEntry>;
  };
  layerListStore: LayerListStore;
  layerBuffers: Map<string, Uint8ClampedArray>;
}

export function getLayerBuffers(): Map<string, Uint8ClampedArray> {
  const map = new Map<string, Uint8ClampedArray>();
  allLayers().forEach((layer) => {
    map.set(layer.id, getBufferOf(layer.id)!);
  });
  return map;
}

export const dumpProject = async (): Promise<Uint8Array> => {
  const project: Project = {
    canvasStore: canvasStore,
    projectStore: projectStore,
    imagePoolStore: {
      entries: new Map(imagePoolStore.entries),
    },
    layerListStore: layerListStore,
    layerBuffers: getLayerBuffers(),
  };
  let packr = new Packr({ useRecords: true, mapsAsObjects: false });
  return packr.pack(project);
};
