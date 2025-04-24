import {
  layerImageStore,
  setLayerImageStore,
} from "~/stores/project/layerImageStore";
import { allLayers, setLayerStore } from "~/stores/project/layerStore";

export const removeLayer = (layerId?: string) => {
  if (layerId === undefined) return;
  const layers = [...allLayers()];
  if (layers.length <= 1) return;
  const index = layers.findIndex((l) => l.id === layerId);
  let newActiveIndex = 0;
  if (index !== 0) newActiveIndex = index - 1;

  layers.splice(index, 1);
  const images = Object.assign({}, layerImageStore);
  delete images[layerId];

  setLayerStore("layers", layers);
  setLayerStore("activeLayerId", layers[newActiveIndex].id);
  setLayerImageStore(images);
};
