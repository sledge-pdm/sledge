// BaseLayer is bottom layer, that only can change color/transparency like canvas fabric.

import { BlendMode, Layer, LayerType } from '~/models/layer/Layer';

export type BaseLayerColorMode = 'transparent' | 'white' | 'black' | 'custom';

export type BaseLayer = Layer & {
  colorMode: BaseLayerColorMode;
};

export const createBaseLayer = (colorMode: BaseLayerColorMode): BaseLayer => {
  return {
    id: 'BASE_LAYER',
    name: 'base',
    type: LayerType.Base,
    typeDescription: '',
    enabled: true,
    opacity: 1,
    mode: BlendMode.normal,
    dotMagnification: 1,
    colorMode,
  };
};
