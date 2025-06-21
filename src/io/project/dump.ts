import { ReactiveMap } from '@solid-primitives/map';
import { Packr } from 'msgpackr';
import { getAgentOf, getBufferOf } from '~/controllers/layer/LayerAgentManager';
import { allLayers } from '~/controllers/layer/LayerListController';
import { mapReplacer } from '~/io/project/jsonTyped';
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

export const dumpProject = async (): Promise<string> => {
  const plain = {
    canvasStore: { ...canvasStore }, // Solid の Proxy だが get trap で素直に取れる
    projectStore: { ...projectStore },
    imagePoolStore: {
      entries: imagePoolStore.entries, // Map → replacer が配列化
    },
    layerListStore: {
      ...layerListStore,
      layers: layerListStore.layers.map((layer) => {
        const agent = getAgentOf(layer.id);
        return {
          ...layer,
          pixels: agent?.getBuffer(), // Uint8ClampedArray のまま
        };
      }),
    },
  };
  return JSON.stringify(plain, mapReplacer);
};

export function getLayerBuffers(): Map<string, Uint8ClampedArray> {
  const map = new Map<string, Uint8ClampedArray>();
  allLayers().forEach((layer) => {
    map.set(layer.id, getBufferOf(layer.id)!);
  });
  return map;
}

export const dumpProject2 = async (): Promise<Uint8Array> => {
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
