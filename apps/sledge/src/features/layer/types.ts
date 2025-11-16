// Layer domain types - Core types used across the layer system

export enum LayerType {
  Base,
  Dot,
  Image,
  Automate,
}

export enum BlendMode {
  normal = 'Normal',
  multiply = 'Multiply',
  screen = 'Screen',
  overlay = 'Overlay',
  softLight = 'Soft Light',
  hardLight = 'Hard Light',
  linearLight = 'Linear Light',
  vividLight = 'Vivid Light',
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  typeDescription: string;
  opacity: number;
  mode: BlendMode;
  enabled: boolean;
  dotMagnification: number;
  cutFreeze: boolean;
}

// BaseLayer types
export type BaseLayerColorMode = 'transparent' | 'white' | 'black' | 'custom';

export type BaseLayer = {
  colorMode: BaseLayerColorMode;
  customColor?: string; // カスタムカラーモード用のHEX色
};
