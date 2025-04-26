import { LayerType } from '../../types/Layer';
import { DSL } from '../dsl/DSL';
import { createLayer } from './createLayer';
import { allLayers, setLayerStore } from '~/stores/project/layerStore';

export const addLayer = async (
  name: string,
  type: LayerType = LayerType.Dot,
  enabled = true,
  dotMagnification = 1,
  dsl?: DSL
) => {
  const newLayer = createLayer(name, type, enabled, dotMagnification, dsl);

  const layers = [...allLayers()];
  layers.push(newLayer);

  setLayerStore('layers', layers);
  setLayerStore('activeLayerId', newLayer.id);

  return layers;
};
