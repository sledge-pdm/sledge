import { BaseLayer, BaseLayerColorMode } from '~/models/layer/BaseLayer';

export function changeBaseLayerColor(baseLayer: BaseLayer, colorMode: BaseLayerColorMode, customColor?: string): BaseLayer {
  return {
    ...baseLayer,
    colorMode,
    customColor,
  };
}

export function changeBaseLayerCustomColor(baseLayer: BaseLayer, customColor: string): BaseLayer {
  return {
    ...baseLayer,
    colorMode: 'custom',
    customColor,
  };
}
