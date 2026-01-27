// Layer feature - Main public interface

// Types
export type { BaseLayer, BaseLayerColorMode, Layer } from './types';

export { LayerType } from './types';

// Model functions (pure utilities)
export {
  blendModeIds,
  blendModeOptions,
  changeBaseLayerColor,
  changeBaseLayerCustomColor,
  createBaseLayer,
  createLayer,
  fallbackLayerProps,
  getBaseLayerColor,
  getBlendModeId,
  getBlendModeName,
} from './model';

export {
  activeIndex,
  activeLayer,
  allLayers,
  clearLayer,
  duplicateLayer,
  findLayerById,
  getActiveLayerIndex,
  getLayerIndex,
  mergeToBelowLayer,
  resetAllLayers,
  setActiveLayerId,
  setBaseLayerColorMode,
  setBaseLayerCustomColor,
} from './service';

export { addLayer, addLayerTo, removeLayer, reorderLayer, setLayerProp, toggleLayerVisibility } from './actions';
