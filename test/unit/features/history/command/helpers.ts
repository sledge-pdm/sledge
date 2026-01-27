import { layerManager } from '~/features/layer/frasco/LayerManager';
import { NEW_LAYER_PROPS } from '~/features/layer/service';
import { type Layer } from '~/features/layer/types';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

export const buildLayer = (id: string, name = id): Layer => ({
  ...NEW_LAYER_PROPS,
  id,
  name,
});

export const resetStore = (layers: Layer[]) => {
  for (const layer of projectStore.layers.layers) {
    layerManager.removeLayer(layer.id);
  }
  setProjectStore('canvas', 'size', { width: 1, height: 1 });
  setProjectStore('layers', 'layers', layers);
  setProjectStore('layers', 'state', 'activeLayerId', layers[0]?.id ?? '');
  setProjectStore('layers', 'state', 'selectionEnabled', false);
  setProjectStore('layers', 'state', 'selected', new Set<string>());
  setProjectStore('layers', 'state', 'baseLayer', { colorMode: 'transparent' });
};
