// Layer domain models - Pure layer utilities and factories

import { DropdownOption } from '@sledge/ui';
import { v4 } from 'uuid';
import { hexToRGBA } from '~/features/color';
import { BaseLayer, BaseLayerColorMode, BlendMode, Layer, LayerType } from './types';

// BlendMode utilities
export const blendModeIds = {
  [BlendMode.normal]: 0,
  [BlendMode.multiply]: 1,
  [BlendMode.screen]: 2,
  [BlendMode.overlay]: 3,
  [BlendMode.softLight]: 4,
  [BlendMode.hardLight]: 5,
  [BlendMode.linearLight]: 6,
  [BlendMode.vividLight]: 7,
};

export const getBlendModeId = (mode: BlendMode): number => blendModeIds[mode];

export const blendModeOptions: DropdownOption<BlendMode>[] = Object.entries(BlendMode).map(([label, value]) => ({
  value,
  label,
}));

export function getBlendModeName(mode: BlendMode): string {
  return blendModeOptions.find((option) => option.value === mode)?.label || 'Unknown';
}

// BaseLayer model functions
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

// Layer factory functions
type CreateLayerProps = Omit<Layer, 'id' | 'typeDescription'> & {
  initImage: Uint8ClampedArray | undefined;
};

export const fallbackLayerProps: CreateLayerProps = {
  name: 'fb layer',
  type: LayerType.Dot,
  opacity: 1,
  mode: BlendMode.normal,
  enabled: true,
  dotMagnification: 1,
  initImage: undefined,
};

function getTypeString(type: LayerType): string {
  switch (type) {
    case LayerType.Base:
      return 'base layer.';
    case LayerType.Dot:
      return 'dot layer.';
    case LayerType.Image:
      return 'image layer.';
    case LayerType.Automate:
      return 'automate layer.';
    default:
      return 'N/A.';
  }
}

/**
 * Get a unique layer name by appending a number if needed
 */
function getNumberUniqueLayerName(baseName: string): string {
  // Note: This function needs to be implemented based on current layer list state
  // For now, returning the base name - will be properly implemented in service
  return baseName;
}

export const createLayer = (props: CreateLayerProps, layerNameCheck?: (name: string) => string): Layer => {
  const name = layerNameCheck ? layerNameCheck(props.name) : props.name;
  const id = v4();

  return {
    id,
    name,
    type: props.type,
    typeDescription: getTypeString(props.type),
    opacity: props.opacity,
    mode: props.mode,
    enabled: props.enabled,
    dotMagnification: props.dotMagnification,
  };
};
