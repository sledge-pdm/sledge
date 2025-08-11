import { BaseLayer, BaseLayerColorMode } from "~/models/layer/BaseLayer";

export function changeBaseLayerColor(
  baseLayer: BaseLayer,
  colorMode: BaseLayerColorMode
): BaseLayer {
  return {
    ...baseLayer,
    colorMode,
  };
}