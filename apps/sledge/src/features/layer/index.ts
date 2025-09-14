// Layer feature - Main public interface

// Types
export type { BaseLayer, BaseLayerColorMode, Layer } from './types';

export { BlendMode, LayerType } from './types';

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

// Service functions (stateful operations)
export {
  activeIndex,
  activeLayer,
  // Layer list management
  addLayer,
  addLayerTo,
  allLayers,
  clearLayer,
  duplicateLayer,
  findLayerById,
  getActiveLayerIndex,
  getCurrentPointingColor,
  getCurrentPointingColorHex,
  getLayerIndex,
  isImagePoolActive,
  mergeToBelowLayer,
  moveLayer,
  removeLayer,
  resetAllLayers,
  resetLayerImage,
  setActiveLayerId,
  // BaseLayer operations
  setBaseLayerColorMode,
  setBaseLayerCustomColor,
  setImagePoolActive,
  // Layer properties
  setLayerName,
  setLayerProp,
} from './service';
