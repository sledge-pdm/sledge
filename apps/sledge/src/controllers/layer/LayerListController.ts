import { adjustZoomToFit } from '~/controllers/canvas/CanvasController';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { setBottomBarText } from '~/controllers/log/LogController';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { cancelMove, cancelSelection } from '~/controllers/selection/SelectionOperator';
import { BlendMode, LayerType } from '~/models/layer/Layer';
import { createLayer } from '~/models/layer/LayerFactory';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export const addLayer = (
  layer: {
    name?: string;
    type?: LayerType;
    enabled?: boolean;
    dotMagnification?: number;
    opacity?: number;
    mode?: BlendMode;
  },
  initImage?: Uint8ClampedArray
) => {
  return addLayerTo(0, layer, initImage);
};

export const addLayerTo = (
  index: number,
  layer: {
    name?: string;
    type?: LayerType;
    enabled?: boolean;
    dotMagnification?: number;
    opacity?: number;
    mode?: BlendMode;
  },
  initImage?: Uint8ClampedArray
) => {
  const { name = 'layer', type = LayerType.Dot, enabled = true, dotMagnification = 1, opacity = 1, mode = BlendMode.normal } = layer;

  const newLayer = createLayer({
    name,
    type,
    enabled,
    dotMagnification,
    opacity,
    mode,
    initImage,
  });

  const layers = [...allLayers()];
  layers.splice(index, 0, newLayer);

  setLayerListStore('layers', layers);
  setActiveLayerId(newLayer.id);

  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${newLayer.id}) added` });

  return newLayer;
};

export function setActiveLayerId(id: string): void {
  const layer = findLayerById(id);
  if (layer) {
    if (!layer.enabled) {
      console.warn('Cannot set inactive layer to active');
      setBottomBarText('Cannot set inactive layer to active');
      return;
    }
    if (layerListStore.activeLayerId === id) return;

    // cancel if move is not committed
    if (selectionManager.isMoveState()) {
      cancelMove();
      cancelSelection();
    }

    setLayerListStore('activeLayerId', id);
  }
}

export function getActiveLayerIndex(): number {
  return getLayerIndex(layerListStore.activeLayerId);
}

export function getLayerIndex(layerId: string) {
  return layerListStore.layers.findIndex((l) => l.id === layerId);
}

export function setImagePoolActive(active: boolean) {
  setLayerListStore('isImagePoolActive', active);
}
export function isImagePoolActive() {
  return layerListStore.isImagePoolActive;
}

export const resetAllLayers = () => {
  layerListStore.layers.forEach((l) => {
    resetLayerImage(l.id, l.dotMagnification);
  });
  adjustZoomToFit();
};

export const moveLayer = (fromIndex: number, targetIndex: number) => {
  const updated = [...layerListStore.layers];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(targetIndex, 0, moved);
  setLayerListStore('layers', updated);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Layer moved from ${fromIndex} to ${targetIndex}` });
};

export const removeLayer = (layerId?: string) => {
  if (layerId === undefined) return;
  const layers = [...allLayers()];
  if (layers.length <= 1) return;
  const index = layers.findIndex((l) => l.id === layerId);
  let newActiveIndex = 0;
  if (index !== 0) newActiveIndex = index - 1;

  layers.splice(index, 1);

  setLayerListStore('layers', layers);
  setLayerListStore('activeLayerId', layers[newActiveIndex].id);
  eventBus.emit('webgl:requestUpdate', { onlyDirty: true, context: `Layer(${layerId}) removed` });
};

export const allLayers = () => layerListStore.layers;
export const findLayerById = (id: string) => allLayers().find((layer) => layer.id === id);
export const activeLayer = () => findLayerById(layerListStore.activeLayerId) || allLayers()[0];
export const activeIndex = () => allLayers().findIndex((layer) => layer.id === layerListStore.activeLayerId);
