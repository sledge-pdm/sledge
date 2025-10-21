import type { Layer } from '~/features/layer';

export interface LayerSnapshot {
  layer: Layer;
  image?: {
    buffer: Uint8ClampedArray;
    width: number;
    height: number;
  };
}

export interface PackedLayerSnapshot {
  layer: Layer;
  image?: {
    webpBuffer: Uint8Array;
    width: number;
    height: number;
  };
}
