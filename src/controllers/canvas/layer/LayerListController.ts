import { BlendMode, LayerType } from '~/models/canvas/layer/Layer';
import { createLayer } from '~/models/canvas/layer/LayerFactory';
import { DSL } from '~/models/dsl/DSL';
import { layerHistoryStore, layerListStore, setLayerHistoryStore, setLayerListStore } from '~/stores/ProjectStores';

export const addLayer = async (
  name: string,
  type: LayerType = LayerType.Dot,
  enabled: boolean = true,
  dotMagnification: number = 1,
  opacity: number = 1,
  mode: BlendMode = BlendMode.normal,
  dsl?: DSL
) => {
  const newLayer = createLayer({ name, type, enabled, dotMagnification, opacity, mode, dsl });

  const layers = [...allLayers()];
  layers.push(newLayer);

  setLayerListStore('layers', layers);
  setLayerListStore('activeLayerId', newLayer.id);

  return layers;
};

export const removeLayer = (layerId?: string) => {
  if (layerId === undefined) return;
  const layers = [...allLayers()];
  if (layers.length <= 1) return;
  const index = layers.findIndex((l) => l.id === layerId);
  let newActiveIndex = 0;
  if (index !== 0) newActiveIndex = index - 1;

  layers.splice(index, 1);
  const histories = Object.assign({}, layerHistoryStore);
  delete histories[layerId];

  setLayerListStore('layers', layers);
  setLayerListStore('activeLayerId', layers[newActiveIndex].id);
  setLayerHistoryStore(histories);
};

export const allLayers = () => layerListStore.layers;
export const findLayerById = (id: string) => allLayers().find((layer) => layer.id === id);
export const activeLayer = () => findLayerById(layerListStore.activeLayerId) || allLayers()[0];
export const activeIndex = () => allLayers().findIndex((layer) => layer.id === layerListStore.activeLayerId);
