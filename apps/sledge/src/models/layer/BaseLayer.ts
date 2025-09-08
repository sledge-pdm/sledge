// BaseLayer is bottom layer, that only can change color/transparency like canvas fabric.

import { hexToRGBA } from '~/features/color';

export type BaseLayerColorMode = 'transparent' | 'white' | 'black' | 'custom';

export type BaseLayer = {
  colorMode: BaseLayerColorMode;
  customColor?: string; // カスタムカラーモード用のHEX色
};

export const createBaseLayer = (colorMode: BaseLayerColorMode): BaseLayer => {
  return {
    colorMode,
  };
};

/**
 * BaseLayerのcolorModeからRGBA色（0-1範囲）を取得
 */
export const getBaseLayerColor = (baseLayer: BaseLayer): [number, number, number, number] => {
  switch (baseLayer.colorMode) {
    case 'transparent':
      return [0, 0, 0, 0];
    case 'white':
      return [1, 1, 1, 1];
    case 'black':
      return [0, 0, 0, 1];
    case 'custom':
      if (baseLayer.customColor) {
        const rgba = hexToRGBA(baseLayer.customColor);
        return [rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3] / 255];
      }
      // カスタム色が設定されていない場合は透明にフォールバック
      return [0, 0, 0, 0];
    default:
      return [0, 0, 0, 0];
  }
};
