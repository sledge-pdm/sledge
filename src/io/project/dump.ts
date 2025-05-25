import { getAgentOf } from '~/controllers/canvas/layer/LayerAgentManager';
import { mapReplacer } from '~/io/project/jsonTyped';
import { canvasStore, imagePoolStore, layerListStore, projectStore } from '~/stores/ProjectStores';

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
