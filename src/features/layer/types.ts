// Layer domain types - Core types used across the layer system

import { BlendMode } from '@sledge-pdm/frasco';

export enum LayerType {
  Base,
  Dot,
  Image,
  Automate,
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  opacity: number;
  mode: BlendMode;
  enabled: boolean;
  cutFreeze: boolean;
}

// BaseLayer types
export type BaseLayerColorMode = 'transparent' | 'white' | 'black' | 'custom';

export type BaseLayer = {
  colorMode: BaseLayerColorMode;
  customColor?: string; // カスタムカラーモード用のHEX色
};
